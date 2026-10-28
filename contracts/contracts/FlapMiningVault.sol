// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FlapVaultTypes} from "./FlapVaultTypes.sol";

interface IAgentIdRegistry {
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @title FlapMiningVault
 * @notice Tax vault for a token launched on FLAP. Native BNB tax drips into a
 *         mining pool; only wallets holding a Binance `.ai` Agent ID can claim a
 *         soulbound rig and mine it out by staking the project token.
 *
 * Design constraints, on purpose:
 *   - No owner, no admin, no pause, no withdrawal function. Tax BNB can only
 *     leave this contract as a mining reward.
 *   - Hashrate is exactly the staked token balance. No hidden multipliers.
 *   - One rig per wallet, soulbound, so a rig can never be traded or split.
 *   - `reserve` is released linearly over `dripWindow` seconds, so the pool
 *     visibly drains and never pays out faster than it fills.
 */
contract FlapMiningVault is ERC721, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant ACC_PRECISION = 1e18;
    uint256 public constant MAX_RIGS_LIMIT = 5_000;
    uint256 public constant MIN_DRIP_WINDOW = 1 hours;
    uint256 public constant MAX_DRIP_WINDOW = 30 days;

    // ------------------------------------------------------------------
    // Immutables
    // ------------------------------------------------------------------

    IERC20 public taxToken;
    address public immutable agentIdRegistry;
    address public immutable creator;
    uint256 public immutable maxRigs;
    uint256 public immutable minStake;
    uint256 public immutable dripWindow;

    // ------------------------------------------------------------------
    // Mining state
    // ------------------------------------------------------------------

    /// @notice BNB held in the vault that has not been released to miners yet.
    uint256 public reserve;
    /// @notice Sum of effective hashrate (staked balance of rigs at or above minStake).
    uint256 public totalHash;
    /// @notice Cumulative BNB released per unit of hashrate, scaled by 1e18.
    uint256 public accPerHash;
    /// @notice Timestamp of the last reserve release.
    uint256 public lastUpdate;

    uint256 public totalTaxReceived;
    uint256 public totalMined;

    uint256 public totalRigs;
    mapping(address => uint256) public rigOf;
    mapping(uint256 => uint256) public stakedOf;
    mapping(uint256 => uint256) public hashDebt;
    mapping(uint256 => uint256) public pending;

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------

    event TaxReceived(address indexed from, uint256 amount, uint256 reserve);
    event Dripped(uint256 amount, uint256 totalHash);
    event RigClaimed(address indexed miner, uint256 indexed rigId);
    event Staked(address indexed miner, uint256 indexed rigId, uint256 amount, uint256 staked, uint256 hash);
    event Unstaked(address indexed miner, uint256 indexed rigId, uint256 amount, uint256 staked, uint256 hash);
    event Mined(address indexed miner, uint256 indexed rigId, uint256 amount);
    event TaxTokenSet(address indexed token);

    // ------------------------------------------------------------------
    // Errors
    // ------------------------------------------------------------------

    error Vault__NoAgentId();
    error Vault__AlreadyHasRig();
    error Vault__NoRig();
    error Vault__SoldOut();
    error Vault__ZeroAmount();
    error Vault__BelowMinStake();
    error Vault__InsufficientStake();
    error Vault__NothingToMine();
    error Vault__TransferFailed();
    error Vault__Soulbound();
    error Vault__NotCreator();
    error Vault__TokenNotSet();
    error Vault__TokenAlreadySet();

    constructor(
        address taxToken_,
        address agentIdRegistry_,
        address creator_,
        uint256 maxRigs_,
        uint256 minStake_,
        uint256 dripWindow_
    ) ERC721("Agent Mine Rig", "RIG") {
        require(agentIdRegistry_ != address(0), "Vault: zero registry");
        require(creator_ != address(0), "Vault: zero creator");
        require(maxRigs_ > 0 && maxRigs_ <= MAX_RIGS_LIMIT, "Vault: bad rig cap");
        require(minStake_ > 0, "Vault: bad min stake");
        require(dripWindow_ >= MIN_DRIP_WINDOW && dripWindow_ <= MAX_DRIP_WINDOW, "Vault: bad drip window");

        taxToken = IERC20(taxToken_);
        agentIdRegistry = agentIdRegistry_;
        creator = creator_;
        maxRigs = maxRigs_;
        minStake = minStake_;
        dripWindow = dripWindow_;
        lastUpdate = block.timestamp;
    }

    /// @notice Bind the project token once. Callable only by the creator and
    ///         irreversible: once set, it can never be changed or cleared.
    function setTaxToken(address token_) external {
        if (msg.sender != creator) revert Vault__NotCreator();
        if (address(taxToken) != address(0)) revert Vault__TokenAlreadySet();
        if (token_ == address(0)) revert Vault__TokenNotSet();
        taxToken = IERC20(token_);
        emit TaxTokenSet(token_);
    }

    // ------------------------------------------------------------------
    // Tax intake
    // ------------------------------------------------------------------

    /// @notice Native BNB tax from the FLAP token. Only BNB is accepted.
    receive() external payable {
        if (msg.value == 0) return;
        _updatePool();
        totalTaxReceived += msg.value;
        reserve += msg.value;
        emit TaxReceived(msg.sender, msg.value, reserve);
    }

    // ------------------------------------------------------------------
    // Rig lifecycle
    // ------------------------------------------------------------------

    /// @notice Claim the caller's single soulbound mining rig. Requires a `.ai` Agent ID.
    function claimRig() external nonReentrant returns (uint256 rigId) {
        if (!hasAgentId(msg.sender)) revert Vault__NoAgentId();
        if (rigOf[msg.sender] != 0) revert Vault__AlreadyHasRig();
        if (totalRigs >= maxRigs) revert Vault__SoldOut();

        _updatePool();

        rigId = ++totalRigs;
        rigOf[msg.sender] = rigId;
        hashDebt[rigId] = accPerHash;

        _safeMint(msg.sender, rigId);
        emit RigClaimed(msg.sender, rigId);
    }

    /// @notice Stake the project token to power the caller's rig.
    function stake(uint256 amount) external nonReentrant {
        uint256 rigId = _requireRig(msg.sender);
        if (address(taxToken) == address(0)) revert Vault__TokenNotSet();
        if (amount == 0) revert Vault__ZeroAmount();

        _updatePool();
        _settle(rigId);

        uint256 oldHash = _hashOf(rigId);
        stakedOf[rigId] += amount;
        uint256 newHash = _hashOf(rigId);
        if (newHash < minStake) revert Vault__BelowMinStake();
        totalHash = totalHash - oldHash + newHash;

        taxToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, rigId, amount, stakedOf[rigId], newHash);
    }

    /// @notice Withdraw staked tokens. Dropping below `minStake` sets hashrate to zero.
    function unstake(uint256 amount) external nonReentrant {
        uint256 rigId = _requireRig(msg.sender);
        if (address(taxToken) == address(0)) revert Vault__TokenNotSet();
        if (amount == 0) revert Vault__ZeroAmount();
        if (amount > stakedOf[rigId]) revert Vault__InsufficientStake();

        _updatePool();
        _settle(rigId);

        uint256 oldHash = _hashOf(rigId);
        stakedOf[rigId] -= amount;
        uint256 newHash = _hashOf(rigId);
        totalHash = totalHash - oldHash + newHash;

        taxToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, rigId, amount, stakedOf[rigId], newHash);
    }

    /// @notice Move everything the caller's rig has mined to the caller's wallet.
    function mine() external nonReentrant {
        uint256 rigId = _requireRig(msg.sender);
        if (!hasAgentId(msg.sender)) revert Vault__NoAgentId();

        _updatePool();
        _settle(rigId);

        uint256 amount = pending[rigId];
        if (amount == 0) revert Vault__NothingToMine();

        pending[rigId] = 0;
        totalMined += amount;

        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert Vault__TransferFailed();

        emit Mined(msg.sender, rigId, amount);
    }

    // ------------------------------------------------------------------
    // Release accounting
    // ------------------------------------------------------------------

    /// @dev Releases `1/dripWindow` of the reserve per second to current hashrate.
    ///      If nobody is mining, the reserve is untouched and time is not banked.
    function _updatePool() internal {
        uint256 dt = block.timestamp - lastUpdate;
        if (dt == 0) return;
        lastUpdate = block.timestamp;

        if (totalHash == 0 || reserve == 0) return;

        uint256 releasable = (reserve * dt) / dripWindow;
        if (releasable > reserve) releasable = reserve;
        if (releasable == 0) return;

        uint256 increment = (releasable * ACC_PRECISION) / totalHash;
        if (increment == 0) return;

        reserve -= releasable;
        accPerHash += increment;
        emit Dripped(releasable, totalHash);
    }

    /// @dev Books `accPerHash` progress into `pending` before hashrate changes.
    function _settle(uint256 rigId) internal {
        uint256 h = _hashOf(rigId);
        uint256 debt = hashDebt[rigId];
        if (h > 0 && accPerHash > debt) {
            pending[rigId] += ((accPerHash - debt) * h) / ACC_PRECISION;
        }
        hashDebt[rigId] = accPerHash;
    }

    function _hashOf(uint256 rigId) internal view returns (uint256) {
        uint256 staked = stakedOf[rigId];
        if (staked < minStake) return 0;
        return staked;
    }

    function _requireRig(address account) internal view returns (uint256 rigId) {
        rigId = rigOf[account];
        if (rigId == 0) revert Vault__NoRig();
    }

    // ------------------------------------------------------------------
    // Soulbound
    // ------------------------------------------------------------------

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Vault__Soulbound();
        return super._update(to, tokenId, auth);
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    function hasAgentId(address account) public view returns (bool) {
        if (account == address(0)) return false;
        try IAgentIdRegistry(agentIdRegistry).balanceOf(account) returns (uint256 balance) {
            return balance > 0;
        } catch {
            return false;
        }
    }

    /// @notice Pending BNB for `account`, including the release accrued since `lastUpdate`.
    function pendingOf(address account) public view returns (uint256) {
        uint256 rigId = rigOf[account];
        if (rigId == 0) return 0;

        uint256 acc = _projectedAcc();
        uint256 h = _hashOf(rigId);
        uint256 amount = pending[rigId];
        uint256 debt = hashDebt[rigId];
        if (h > 0 && acc > debt) {
            amount += ((acc - debt) * h) / ACC_PRECISION;
        }
        return amount;
    }

    function _projectedAcc() internal view returns (uint256) {
        uint256 dt = block.timestamp - lastUpdate;
        if (dt == 0 || totalHash == 0 || reserve == 0) return accPerHash;

        uint256 releasable = (reserve * dt) / dripWindow;
        if (releasable > reserve) releasable = reserve;
        return accPerHash + (releasable * ACC_PRECISION) / totalHash;
    }

    /// @notice One call for the whole dashboard.
    function poolState()
        external
        view
        returns (
            uint256 reserve_,
            uint256 releasePerDay_,
            uint256 totalHash_,
            uint256 totalRigs_,
            uint256 maxRigs_,
            uint256 totalTaxReceived_,
            uint256 totalMined_,
            uint256 lastUpdate_,
            uint256 dripWindow_
        )
    {
        reserve_ = reserve;
        releasePerDay_ = (reserve * 1 days) / dripWindow;
        totalHash_ = totalHash;
        totalRigs_ = totalRigs;
        maxRigs_ = maxRigs;
        totalTaxReceived_ = totalTaxReceived;
        totalMined_ = totalMined;
        lastUpdate_ = lastUpdate;
        dripWindow_ = dripWindow;
    }

    /// @notice One call for a miner panel.
    function rigInfo(
        address account
    )
        external
        view
        returns (uint256 rigId, uint256 staked, uint256 hash, uint256 pending_, bool eligible)
    {
        rigId = rigOf[account];
        if (rigId != 0) {
            staked = stakedOf[rigId];
            hash = _hashOf(rigId);
            pending_ = pendingOf(account);
        }
        eligible = hasAgentId(account);
    }

    // ------------------------------------------------------------------
    // FLAP vault interface
    // ------------------------------------------------------------------

    function description() external pure returns (string memory) {
        return unicode"仅持有币安 .ai Agent ID 的钱包可认领矿机；矿池税收只能被挖出，合约内没有任何提款函数。";
    }

    function vaultQuoteToken() external pure returns (address) {
        return address(0);
    }

    function vaultSpecVersion() external pure returns (string memory) {
        return "v3";
    }

    function vaultUISchema() external pure returns (FlapVaultTypes.VaultUISchema memory schema) {
        schema.vaultType = "AgentMiningVault";
        schema.description = unicode"币安 Agent ID 专属矿场：认领矿机、质押项目代币获得算力、把税收挖走";

        schema.methods = new FlapVaultTypes.VaultMethodSchema[](6);

        schema.methods[0] = FlapVaultTypes.VaultMethodSchema(
            "claimRig",
            unicode"认领一台矿机（需持有 .ai Agent ID，每个钱包限 1 台）",
            _noFields(),
            _noFields(),
            _noApprovals(),
            false,
            false,
            true
        );

        schema.methods[1] = FlapVaultTypes.VaultMethodSchema(
            "stake",
            unicode"质押项目代币，质押量即算力（最低 minStake）",
            _one(_field("amount", "uint256", unicode"质押的代币数量", 18)),
            _noFields(),
            _oneApproval("erc20", "amount"),
            false,
            false,
            true
        );

        schema.methods[2] = FlapVaultTypes.VaultMethodSchema(
            "unstake",
            unicode"取回质押；低于最低质押量后算力归零，已挖出的部分仍可领取",
            _one(_field("amount", "uint256", unicode"取回的代币数量", 18)),
            _noFields(),
            _noApprovals(),
            false,
            false,
            true
        );

        schema.methods[3] = FlapVaultTypes.VaultMethodSchema(
            "mine",
            unicode"把矿池里属于你的 BNB 提取到钱包",
            _noFields(),
            _noFields(),
            _noApprovals(),
            false,
            false,
            true
        );

        schema.methods[4] = FlapVaultTypes.VaultMethodSchema(
            "rigInfo",
            unicode"查询矿机状态：质押量、算力、待领取",
            _one(_field("account", "address", unicode"钱包地址", 0)),
            _fiveOutputs(),
            _noApprovals(),
            false,
            false,
            false
        );

        schema.methods[5] = FlapVaultTypes.VaultMethodSchema(
            "poolState",
            unicode"查询矿池：储备、每日释放、全网算力、矿机数",
            _noFields(),
            _noFields(),
            _noApprovals(),
            false,
            false,
            false
        );
    }

    // ------------------------------------------------------------------
    // Small schema helpers
    // ------------------------------------------------------------------

    function _field(
        string memory name_,
        string memory type_,
        string memory description_,
        uint8 decimals_
    ) internal pure returns (FlapVaultTypes.FieldDescriptor memory) {
        return FlapVaultTypes.FieldDescriptor(name_, type_, description_, decimals_);
    }

    function _one(
        FlapVaultTypes.FieldDescriptor memory field
    ) internal pure returns (FlapVaultTypes.FieldDescriptor[] memory arr) {
        arr = new FlapVaultTypes.FieldDescriptor[](1);
        arr[0] = field;
    }

    function _fiveOutputs() internal pure returns (FlapVaultTypes.FieldDescriptor[] memory arr) {
        arr = new FlapVaultTypes.FieldDescriptor[](5);
        arr[0] = _field("rigId", "uint256", unicode"矿机编号，0 表示还没认领", 0);
        arr[1] = _field("staked", "uint256", unicode"已质押数量", 18);
        arr[2] = _field("hash", "uint256", unicode"当前算力", 18);
        arr[3] = _field("pending", "uint256", unicode"待领取 BNB", 18);
        arr[4] = _field("eligible", "bool", unicode"是否持有 .ai Agent ID", 0);
    }

    function _noFields() internal pure returns (FlapVaultTypes.FieldDescriptor[] memory) {
        return new FlapVaultTypes.FieldDescriptor[](0);
    }

    function _noApprovals() internal pure returns (FlapVaultTypes.ApproveAction[] memory) {
        return new FlapVaultTypes.ApproveAction[](0);
    }

    function _oneApproval(
        string memory tokenType_,
        string memory amountFieldName_
    ) internal pure returns (FlapVaultTypes.ApproveAction[] memory arr) {
        arr = new FlapVaultTypes.ApproveAction[](1);
        arr[0] = FlapVaultTypes.ApproveAction(tokenType_, amountFieldName_);
    }
}
