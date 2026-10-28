const { ethers } = require("hardhat");

const MAX_RIGS = 260;
const MIN_STAKE = ethers.parseEther("100000");
const DAY = 86400;

async function main() {
  const [deployer, miner] = await ethers.getSigners();

  const token = await (await ethers.getContractFactory("MockERC20")).deploy();
  const registry = await (await ethers.getContractFactory("MockAgentIdRegistry")).deploy();
  const vault = await (
    await ethers.getContractFactory("FlapMiningVault")
  ).deploy(token.target, registry.target, deployer.address, MAX_RIGS, MIN_STAKE, DAY);

  await registry.mint(miner.address);
  await token.mint(miner.address, ethers.parseEther("1000000"));
  await token.connect(miner).approve(vault.target, ethers.MaxUint256);
  await vault.connect(miner).claimRig();
  await vault.connect(miner).stake(MIN_STAKE);
  await deployer.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });

  console.log(
    JSON.stringify({
      token: token.target,
      registry: registry.target,
      vault: vault.target,
      miner: miner.address,
      deployer: deployer.address,
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
