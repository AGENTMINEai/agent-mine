const { ethers } = require("hardhat");

/**
 * Deploys the vault factory that gets pasted into FLAP's launch page.
 *
 *   VAULT_PORTAL=0x… AGENT_ID_REGISTRY=0x… npx hardhat run scripts/deploy-factory.js --network bsc
 */

const DEFAULT_PORTAL = "0x90497450f2a706f1951b5bdda52B4E5d16f34C06";
const DEFAULT_REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";

// Recommended first launch.
const MAX_RIGS = 260;
const MIN_STAKE = ethers.parseUnits("100000", 18);
const DRIP_WINDOW = 86400;

async function main() {
  const portal = process.env.VAULT_PORTAL || DEFAULT_PORTAL;
  const registry = process.env.AGENT_ID_REGISTRY || DEFAULT_REGISTRY;

  const code = await ethers.provider.getCode(portal);
  if (code === "0x") throw new Error(`VAULT_PORTAL has no code: ${portal}`);
  const regCode = await ethers.provider.getCode(registry);
  if (regCode === "0x") throw new Error(`AGENT_ID_REGISTRY has no code: ${registry}`);

  const [deployer] = await ethers.getSigners();
  console.log("deployer      ", deployer.address);
  console.log("vaultPortal   ", portal);
  console.log("agentIdRegistry", registry);

  const factory = await (
    await ethers.getContractFactory("FlapMiningVaultFactory")
  ).deploy(portal, registry);
  await factory.waitForDeployment();

  const vaultData = ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256", "uint256"],
    [MAX_RIGS, MIN_STAKE, DRIP_WINDOW]
  );

  console.log("");
  console.log("Factory       ", factory.target);
  console.log("specVersion   ", await factory.factorySpecVersion());
  console.log("");
  console.log("FLAP launch fields:");
  console.log("  maxRigs            ", MAX_RIGS);
  console.log("  minStake           ", MIN_STAKE.toString(), "(100,000 tokens)");
  console.log("  dripWindowSeconds  ", DRIP_WINDOW);
  console.log("  vaultFactory       ", factory.target);
  console.log("  vaultData          ", vaultData);
  console.log("");
  console.log("Verify the source on BscScan before announcing:");
  console.log(`  npx hardhat verify --network bsc ${factory.target} ${portal} ${registry}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
