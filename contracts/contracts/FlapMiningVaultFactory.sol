// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {FlapVaultTypes} from "./FlapVaultTypes.sol";
import {FlapMiningVault} from "./FlapMiningVault.sol";

/**
 * @title FlapMiningVaultFactory
 * @notice Paste this address into FLAP's "vault factory" field when launching a
 *         tax token (VaultPortal.newTokenV6WithVault / newTaxTokenWithVault).
 *
 * Flow:
 *   1. FLAP UI calls `vaultDataSchema()` and renders the three launch fields.
 *   2. Launcher encodes `vaultData = abi.encode(uint256 maxRigs, uint256 minStake,
 *      uint256 dripWindowSeconds)`.
 *   3. VaultPortal calls `newVault(predictedToken, quoteToken, creator, vaultData)`.
 *   4. This factory deploys a FlapMiningVault. Every vault inherits the same
 *      immutable Agent ID registry; the launcher cannot swap it later.
 *
 * The factory itself holds no funds and has no admin.
 */
contract FlapMiningVaultFactory {
    /// @dev FLAP passes the CREATE2-predicted tax token address (no code yet).
    struct NewTokenParams {
        string name;
        string symbol;
        string meta;
        uint8 dexThresh;
        bytes32 salt;
        uint8 migratorType;
        address quoteToken;
        uint256 quoteAmt;
        bytes permitData;
        bytes32 extensionID;
        bytes extensionData;
        uint8 dexId;
        uint8 lpFeeProfile;
        uint16 buyTaxRate;
        uint16 sellTaxRate;
        uint64 taxDuration;
        uint64 antiFarmerDuration;
        uint16 mktBps;
        uint16 deflationBps;
        uint16 dividendBps;
        uint16 lpBps;
        uint256 minimumShareBalance;
        address dividendToken;
        address commissionReceiver;
        uint8 tokenVersion;
        address vaultFactory;
        bytes vaultData;
    }

    address public immutable vaultPortal;
    address public immutable agentIdRegistry;

    address[] private _vaults;
    mapping(address => bool) public isVault;
    mapping(address => address[]) private _vaultsByToken;

    event VaultCreated(
        address indexed vault,
        address indexed taxToken,
        address indexed creator,
        uint256 maxRigs,
        uint256 minStake,
        uint256 dripWindow
    );

    constructor(address vaultPortal_, address agentIdRegistry_) {
        require(vaultPortal_ != address(0), "Factory: zero portal");
        require(agentIdRegistry_ != address(0), "Factory: zero registry");
        vaultPortal = vaultPortal_;
        agentIdRegistry = agentIdRegistry_;
    }

    // ---------------------------------------------------------------------
    // FLAP factory interface
    // ---------------------------------------------------------------------

    /**
     * @param taxToken  CREATE2-predicted tax token address (no code yet).
     * @param quoteToken Revenue currency; only address(0) (native BNB) is supported.
     * @param creator   The launcher, recorded on the vault for attribution.
     * @param vaultData abi.encode(uint256 maxRigs, uint256 minStake, uint256 dripWindowSeconds)
     */
    function newVault(
        address taxToken,
        address quoteToken,
        address creator,
        bytes calldata vaultData
    ) external returns (address vault) {
        require(msg.sender == vaultPortal, "Factory: only VaultPortal");
        require(taxToken != address(0), "Factory: zero token");
        require(creator != address(0), "Factory: zero creator");
        require(isQuoteTokenSupported(quoteToken), "Factory: native BNB only");
        require(vaultData.length >= 96, "Factory: bad vaultData");

        (uint256 maxRigs_, uint256 minStake_, uint256 dripWindow_) = abi.decode(
            vaultData,
            (uint256, uint256, uint256)
        );

        vault = address(
            new FlapMiningVault(taxToken, agentIdRegistry, creator, maxRigs_, minStake_, dripWindow_)
        );

        _vaults.push(vault);
        _vaultsByToken[taxToken].push(vault);
        isVault[vault] = true;

        emit VaultCreated(vault, taxToken, creator, maxRigs_, minStake_, dripWindow_);
    }

    function isQuoteTokenSupported(address quoteToken) public pure returns (bool) {
        return quoteToken == address(0);
    }

    /// @notice Schema FLAP's UI uses to render the three launch-time fields.
    function vaultDataSchema() public pure returns (FlapVaultTypes.VaultDataSchema memory schema) {
        schema.description = unicode"仅持有币安 .ai Agent ID 的钱包可启动矿机，矿池税收只能被挖出";

        schema.fields = new FlapVaultTypes.FieldDescriptor[](3);
        schema.fields[0] = FlapVaultTypes.FieldDescriptor(
            "maxRigs",
            "uint256",
            unicode"矿机数量上限（1 - 5000）",
            0
        );
        schema.fields[1] = FlapVaultTypes.FieldDescriptor(
            "minStake",
            "uint256",
            unicode"每台矿机最低质押量（项目代币，18 位小数）",
            18
        );
        schema.fields[2] = FlapVaultTypes.FieldDescriptor(
            "dripWindowSeconds",
            "uint256",
            unicode"矿池储备释放窗口（秒，3600 - 2592000；86400 = 一天挖完当前储备）",
            0
        );
        schema.isArray = false;
    }

    /// @notice Optional preflight FLAP may call before the launch transaction.
    function onBeforeNewTokenV6WithVault(
        NewTokenParams calldata params
    ) external view returns (bool ok, string memory reason) {
        if (!isQuoteTokenSupported(params.quoteToken)) {
            return (false, "quote token must be native BNB");
        }
        if (params.vaultFactory != address(this)) {
            return (false, "vaultFactory must be this contract");
        }
        if (params.dividendBps == 0) {
            return (false, "dividendBps must be > 0 or the mining pool gets no tax");
        }
        if (params.mktBps + params.deflationBps + params.dividendBps + params.lpBps > 10_000) {
            return (false, "tax split exceeds 10000 bps");
        }
        (uint256 maxRigs_, uint256 minStake_, uint256 dripWindow_) = abi.decode(
            params.vaultData,
            (uint256, uint256, uint256)
        );
        if (maxRigs_ == 0 || maxRigs_ > 5_000) return (false, "maxRigs out of range");
        if (minStake_ == 0) return (false, "minStake must be > 0");
        if (dripWindow_ < 1 hours || dripWindow_ > 30 days) return (false, "dripWindow out of range");
        return (true, "");
    }

    /// @notice Address FLAP's UI treats as the vault reader/oracle handle.
    function reader() external view returns (address) {
        return address(this);
    }

    function factorySpecVersion() external pure returns (string memory) {
        return "v2.2";
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function vaultsOf(address taxToken) external view returns (address[] memory) {
        return _vaultsByToken[taxToken];
    }

    function allVaults() external view returns (address[] memory) {
        return _vaults;
    }

    function vaultCount() external view returns (uint256) {
        return _vaults.length;
    }
}
