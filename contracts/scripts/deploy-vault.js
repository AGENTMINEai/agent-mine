const { ethers } = require("hardhat");

/**
 * Deploys a standalone FlapMiningVault for an existing token, or an unbound
 * vault that the creator binds once afterwards.
 *
 *   npx hardhat run scripts/deploy-vault.js --network bsc
 *   TOKEN=0x… CREATOR=0x… npx hardhat run scripts/deploy-vault.js --network bsc
 *
 * Binding rules (enforced on-chain):
 *   - only the creator can call setTaxToken
 *   - exactly once
 *   - irreversible: it can never be changed or cleared
 */

const ZERO = ethers.ZeroAddress;
const DEFAULT_REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";

async function main() {
  const token = process.env.TOKEN || ZERO;
  if (token !== ZERO && !/^0x[0-9a-fA-F]{40}$/.test(token)) {
    throw new Error(`TOKEN must be a 40-hex address or empty, got: ${token}`);
  }

  const registry = process.env.AGENT_ID_REGISTRY || DEFAULT_REGISTRY;
  const maxRigs = Number(process.env.MAX_RIGS || 260);
  const minStake = ethers.parseUnits(process.env.MIN_STAKE || "100000", 18);
  const dripWindow = Number(process.env.DRIP_WINDOW || 86400);

  const [deployer] = await ethers.getSigners();
  const creator = process.env.CREATOR || deployer.address;

  console.log("deployer   ", deployer.address);
  console.log("creator    ", creator);
  console.log("token      ", token === ZERO ? "(unbound, bind once later)" : token);
  console.log("registry   ", registry);
  console.log("maxRigs    ", maxRigs);
  console.log("minStake   ", minStake.toString());
  console.log("dripWindow ", dripWindow);

  if (token !== ZERO) {
    const tokenCode = await ethers.provider.getCode(token);
    if (tokenCode === "0x") throw new Error(`token has no code on this chain: ${token}`);
  }
  const registryCode = await ethers.provider.getCode(registry);
  if (registryCode === "0x") throw new Error(`registry has no code: ${registry}`);

  const Vault = await ethers.getContractFactory("FlapMiningVault");
  const vault = await Vault.deploy(token, registry, creator, maxRigs, minStake, dripWindow);
  await vault.waitForDeployment();

  const receipt = await vault.deploymentTransaction().wait();
  console.log("");
  console.log("VAULT      ", vault.target);
  console.log("tx         ", receipt.hash);
  console.log("block      ", receipt.blockNumber);
  console.log("gasUsed    ", receipt.gasUsed.toString());
  console.log("");
  if (token === ZERO) {
    console.log("Bound token: still empty. Bind once from the creator wallet:");
    console.log(`  setTaxToken(address) on ${vault.target}`);
  } else {
    console.log("Next: point the token's tax to this address, then verify the source on BscScan.");
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
