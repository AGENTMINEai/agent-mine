import { parseAbi } from "viem";

export const vaultAbi = parseAbi([
  "function claimRig() returns (uint256)",
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function mine()",
  "function pendingOf(address account) view returns (uint256)",
  "function rigOf(address account) view returns (uint256)",
  "function stakedOf(uint256 rigId) view returns (uint256)",
  "function rigInfo(address account) view returns (uint256 rigId, uint256 staked, uint256 hash, uint256 pending, bool eligible)",
  "function poolState() view returns (uint256 reserve, uint256 releasePerDay, uint256 totalHash, uint256 totalRigs, uint256 maxRigs, uint256 totalTaxReceived, uint256 totalMined, uint256 lastUpdate, uint256 dripWindow)",
  "function minStake() view returns (uint256)",
  "function taxToken() view returns (address)",
  "function maxRigs() view returns (uint256)",
  "function hasAgentId(address account) view returns (bool)",
  "function description() view returns (string)",
  "function totalHash() view returns (uint256)",
  "function totalMined() view returns (uint256)",
  "function totalTaxReceived() view returns (uint256)",
  "event TaxReceived(address indexed from, uint256 amount, uint256 reserve)",
  "event Mined(address indexed miner, uint256 indexed rigId, uint256 amount)",
  "event RigClaimed(address indexed miner, uint256 indexed rigId)",
]);

export const agentIdAbi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
]);

export const erc20Abi = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
]);
