const { ethers, network } = require("hardhat");
const { expect } = require("chai");

const DAY = 24 * 60 * 60;
const MAX_RIGS = 500;
const MIN_STAKE = ethers.parseEther("100");

async function now() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}

async function advance(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

async function deployVault({ maxRigs = MAX_RIGS, minStake = MIN_STAKE, dripWindow = DAY } = {}) {
  const [deployer, alice, bob, carol] = await ethers.getSigners();

  const registry = await (await ethers.getContractFactory("MockAgentIdRegistry")).deploy();
  const token = await (await ethers.getContractFactory("MockERC20")).deploy();
  const vault = await (
    await ethers.getContractFactory("FlapMiningVault")
  ).deploy(token.target, registry.target, deployer.address, maxRigs, minStake, dripWindow);

  for (const s of [alice, bob, carol]) {
    await registry.mint(s.address);
    await token.mint(s.address, ethers.parseEther("100000"));
    await token.connect(s).approve(vault.target, ethers.MaxUint256);
  }

  return { deployer, alice, bob, carol, registry, token, vault };
}

describe("FlapMiningVault", function () {
  it("gates rig claims on the .ai Agent ID registry", async function () {
    const { alice, registry, vault } = await deployVault();
    await registry.burn(alice.address);

    await expect(vault.connect(alice).claimRig()).to.be.revertedWithCustomError(
      vault,
      "Vault__NoAgentId"
    );

    await registry.mint(alice.address);
    await expect(vault.connect(alice).claimRig()).to.emit(vault, "RigClaimed");
  });

  it("allows exactly one soulbound rig per wallet", async function () {
    const { alice, bob, vault } = await deployVault();

    await vault.connect(alice).claimRig();
    await expect(vault.connect(alice).claimRig()).to.be.revertedWithCustomError(
      vault,
      "Vault__AlreadyHasRig"
    );

    await expect(
      vault.connect(alice).transferFrom(alice.address, bob.address, 1)
    ).to.be.revertedWithCustomError(vault, "Vault__Soulbound");

    expect(await vault.ownerOf(1)).to.equal(alice.address);
  });

  it("caps the rig supply", async function () {
    const { alice, bob, vault } = await deployVault({ maxRigs: 1 });
    await vault.connect(alice).claimRig();
    await expect(vault.connect(bob).claimRig()).to.be.revertedWithCustomError(
      vault,
      "Vault__SoldOut"
    );
  });

  it("requires a rig and the minimum stake before hashrate counts", async function () {
    const { alice, token, vault } = await deployVault();

    await expect(vault.connect(alice).stake(1n)).to.be.revertedWithCustomError(
      vault,
      "Vault__NoRig"
    );

    await vault.connect(alice).claimRig();

    await expect(
      vault.connect(alice).stake(ethers.parseEther("99"))
    ).to.be.revertedWithCustomError(vault, "Vault__BelowMinStake");

    await vault.connect(alice).stake(MIN_STAKE);
    expect(await vault.totalHash()).to.equal(MIN_STAKE);
    expect(await vault.stakedOf(1)).to.equal(MIN_STAKE);
    expect(await token.balanceOf(vault.target)).to.equal(MIN_STAKE);
  });

  it("drips the reserve linearly over the drip window", async function () {
    const { alice, vault } = await deployVault();
    await vault.connect(alice).claimRig();
    await vault.connect(alice).stake(ethers.parseEther("1000"));

    await alice.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });
    expect(await vault.reserve()).to.equal(ethers.parseEther("1"));

    await advance(DAY / 2);

    // Half the window elapsed -> half the reserve is releasable.
    const pending = await vault.pendingOf(alice.address);
    expect(pending).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.001"));

    const before = await ethers.provider.getBalance(alice.address);
    const tx = await vault.connect(alice).mine();
    const receipt = await tx.wait();
    const gas = receipt.gasUsed * receipt.gasPrice;
    const after = await ethers.provider.getBalance(alice.address);

    expect(after + gas - before).to.equal(await vault.totalMined());
    expect(await vault.reserve()).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.001"));
    expect(await vault.pendingOf(alice.address)).to.equal(0);
  });

  it("splits rewards pro-rata by hashrate", async function () {
    const { alice, bob, vault } = await deployVault();
    await vault.connect(alice).claimRig();
    await vault.connect(bob).claimRig();

    await vault.connect(alice).stake(ethers.parseEther("1000"));
    await vault.connect(bob).stake(ethers.parseEther("3000"));

    await alice.sendTransaction({ to: vault.target, value: ethers.parseEther("4") });
    await advance(DAY);

    expect(await vault.pendingOf(alice.address)).to.be.closeTo(
      ethers.parseEther("1"),
      ethers.parseEther("0.002")
    );
    expect(await vault.pendingOf(bob.address)).to.be.closeTo(
      ethers.parseEther("3"),
      ethers.parseEther("0.002")
    );

    await vault.connect(alice).mine();
    await vault.connect(bob).mine();
    expect(await vault.reserve()).to.equal(0);
  });

  it("freezes hashrate when stake drops below the minimum but keeps what was mined", async function () {
    const { alice, vault } = await deployVault();
    await vault.connect(alice).claimRig();
    await vault.connect(alice).stake(ethers.parseEther("1000"));

    await alice.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });
    await advance(DAY / 2);
    await vault.connect(alice).unstake(ethers.parseEther("950"));

    expect(await vault.totalHash()).to.equal(0);
    expect(await vault.pendingOf(alice.address)).to.be.closeTo(
      ethers.parseEther("0.5"),
      ethers.parseEther("0.001")
    );

    // New tax no longer accrues to a rig without hashrate.
    await alice.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });
    await advance(DAY);
    expect(await vault.pendingOf(alice.address)).to.be.closeTo(
      ethers.parseEther("0.5"),
      ethers.parseEther("0.001")
    );

    await vault.connect(alice).mine();
    // The first 0.5 BNB was already released out of `reserve` into pending.
    expect(await vault.reserve()).to.be.closeTo(ethers.parseEther("1.5"), ethers.parseEther("0.001"));
  });

  it("stops paying out once the .ai Agent ID is gone", async function () {
    const { alice, registry, vault } = await deployVault();
    await vault.connect(alice).claimRig();
    await vault.connect(alice).stake(ethers.parseEther("1000"));
    await alice.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });
    await advance(DAY);

    await registry.burn(alice.address);
    await expect(vault.connect(alice).mine()).to.be.revertedWithCustomError(
      vault,
      "Vault__NoAgentId"
    );

    await registry.mint(alice.address);
    await vault.connect(alice).mine();
  });

  it("exposes no owner, pause or withdrawal surface", async function () {
    const { vault } = await deployVault();
    for (const fn of ["owner", "withdrawAll", "withdrawFees", "withdrawUnallocated", "pause", "rescue"]) {
      expect(vault[fn], fn).to.equal(undefined);
    }
  });

  it("exposes a FLAP vault UI schema", async function () {
    const { vault } = await deployVault();
    const schema = await vault.vaultUISchema();
    expect(schema.vaultType).to.equal("AgentMiningVault");
    expect(schema.methods.length).to.equal(6);
    expect(schema.methods.map((m) => m.name)).to.deep.equal([
      "claimRig",
      "stake",
      "unstake",
      "mine",
      "rigInfo",
      "poolState",
    ]);
    expect(await vault.vaultQuoteToken()).to.equal(ethers.ZeroAddress);
    expect(await vault.vaultSpecVersion()).to.equal("v3");
    expect((await vault.description()).length).to.be.greaterThan(0);
  });

  it("never releases more BNB than the reserve holds", async function () {
    const { alice, bob, vault } = await deployVault();
    await vault.connect(alice).claimRig();
    await vault.connect(bob).claimRig();
    await vault.connect(alice).stake(ethers.parseEther("1000"));
    await vault.connect(bob).stake(ethers.parseEther("500"));

    await alice.sendTransaction({ to: vault.target, value: ethers.parseEther("0.3") });
    await advance(DAY * 10); // far beyond the drip window

    await vault.connect(alice).mine();
    await vault.connect(bob).mine();

    expect(await vault.reserve()).to.equal(0);
    expect(await vault.totalMined()).to.equal(ethers.parseEther("0.3"));
    expect(await ethers.provider.getBalance(vault.target)).to.equal(0);
  });

  it("reports the pool state in one call", async function () {
    const { alice, vault } = await deployVault();
    await vault.connect(alice).claimRig();
    await vault.connect(alice).stake(ethers.parseEther("1000"));
    await alice.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });

    const s = await vault.poolState();
    expect(s.reserve_).to.equal(ethers.parseEther("1"));
    expect(s.releasePerDay_).to.equal(ethers.parseEther("1"));
    expect(s.totalHash_).to.equal(ethers.parseEther("1000"));
    expect(s.totalRigs_).to.equal(1);
    expect(s.maxRigs_).to.equal(BigInt(MAX_RIGS));
  });
});

describe("FlapMiningVaultFactory", function () {
  async function deployFactory() {
    const [deployer, creator] = await ethers.getSigners();
    const registry = await (await ethers.getContractFactory("MockAgentIdRegistry")).deploy();
    const portal = await (await ethers.getContractFactory("MockVaultPortal")).deploy();
    const factory = await (
      await ethers.getContractFactory("FlapMiningVaultFactory")
    ).deploy(portal.target, registry.target);
    const token = await (await ethers.getContractFactory("MockERC20")).deploy();
    return { deployer, creator, registry, portal, factory, token };
  }

  function encodeVaultData(maxRigs, minStake, dripWindow) {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256", "uint256"],
      [maxRigs, minStake, dripWindow]
    );
  }

  it("renders a three-field launch schema", async function () {
    const { factory } = await deployFactory();
    const schema = await factory.vaultDataSchema();
    expect(schema.fields.length).to.equal(3);
    expect(schema.fields[0].name).to.equal("maxRigs");
    expect(schema.fields[1].name).to.equal("minStake");
    expect(schema.fields[2].name).to.equal("dripWindowSeconds");
  });

  it("only lets the VaultPortal create vaults", async function () {
    const { factory, token, creator } = await deployFactory();
    const data = encodeVaultData(500, MIN_STAKE, DAY);

    await expect(
      factory.newVault(token.target, ethers.ZeroAddress, creator.address, data)
    ).to.be.revertedWith("Factory: only VaultPortal");
  });

  it("deploys a configured vault through the portal", async function () {
    const { portal, factory, token, creator } = await deployFactory();
    const data = encodeVaultData(500, MIN_STAKE, DAY);

    await expect(portal.createVault(factory.target, token.target, creator.address, data)).to.emit(
      factory,
      "VaultCreated"
    );

    const vaults = await factory.vaultsOf(token.target);
    expect(vaults.length).to.equal(1);

    const vault = await ethers.getContractAt("FlapMiningVault", vaults[0]);
    expect(await vault.taxToken()).to.equal(token.target);
    expect(await vault.maxRigs()).to.equal(500n);
    expect(await vault.minStake()).to.equal(MIN_STAKE);
    expect(await vault.dripWindow()).to.equal(BigInt(DAY));
    expect(await vault.creator()).to.equal(creator.address);
  });

  it("rejects non-BNB quote tokens", async function () {
    const { factory } = await deployFactory();
    expect(await factory.isQuoteTokenSupported(ethers.ZeroAddress)).to.equal(true);
    expect(await factory.isQuoteTokenSupported(ethers.Wallet.createRandom().address)).to.equal(false);
  });
});

describe("FlapMiningVault token binding", function () {
  async function deployUnbound() {
    const [deployer, alice, bob] = await ethers.getSigners();
    const registry = await (await ethers.getContractFactory("MockAgentIdRegistry")).deploy();
    const token = await (await ethers.getContractFactory("MockERC20")).deploy();
    const vault = await (await ethers.getContractFactory("FlapMiningVault")).deploy(
      ethers.ZeroAddress,
      registry.target,
      deployer.address,
      260,
      ethers.parseEther("100"),
      DAY
    );
    await registry.mint(alice.address);
    await token.mint(alice.address, ethers.parseEther("1000"));
    await token.connect(alice).approve(vault.target, ethers.MaxUint256);
    return { deployer, alice, bob, registry, token, vault };
  }

  it("binds the token exactly once, only by the creator", async function () {
    const { deployer, alice, token, vault } = await deployUnbound();

    await expect(vault.connect(alice).setTaxToken(token.target))
      .to.be.revertedWithCustomError(vault, "Vault__NotCreator");
    await expect(vault.connect(deployer).setTaxToken(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(vault, "Vault__TokenNotSet");

    await expect(vault.connect(deployer).setTaxToken(token.target))
      .to.emit(vault, "TaxTokenSet")
      .withArgs(token.target);
    expect(await vault.taxToken()).to.equal(token.target);

    await expect(vault.connect(deployer).setTaxToken(token.target))
      .to.be.revertedWithCustomError(vault, "Vault__TokenAlreadySet");
    // no unbinding, not even back to zero
    await expect(vault.connect(deployer).setTaxToken(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(vault, "Vault__TokenAlreadySet");
  });

  it("accepts tax before binding, but blocks staking until bound", async function () {
    const { deployer, alice, token, vault } = await deployUnbound();

    await vault.connect(alice).claimRig();
    await expect(vault.connect(alice).stake(ethers.parseEther("100")))
      .to.be.revertedWithCustomError(vault, "Vault__TokenNotSet");

    await alice.sendTransaction({ to: vault.target, value: ethers.parseEther("1") });
    expect(await vault.reserve()).to.equal(ethers.parseEther("1"));

    await vault.connect(deployer).setTaxToken(token.target);
    await vault.connect(alice).stake(ethers.parseEther("100"));
    expect(await vault.totalHash()).to.equal(ethers.parseEther("100"));
  });
});
