import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("LaunchpadFactory", function () {
  const PLATFORM_FEE = 250; // 2.5%
  const TOKEN_PRICE = ethers.parseEther("0.001");
  const HARD_CAP = ethers.parseEther("100");
  const SOFT_CAP = ethers.parseEther("50");
  const MIN_INVESTMENT = ethers.parseEther("0.1");
  const MAX_INVESTMENT = ethers.parseEther("10");
  const TGE_PERCENT = 20;
  const CLIFF_DURATION = 30 * 24 * 60 * 60;
  const VESTING_DURATION = 180 * 24 * 60 * 60;

  async function deployFactoryFixture() {
    const [owner, feeCollector, creator1, creator2, user1] =
      await ethers.getSigners();

    // Deploy factory
    const FactoryContract = await ethers.getContractFactory("LaunchpadFactory");
    const factory = await FactoryContract.deploy(
      owner.address,
      feeCollector.address,
      PLATFORM_FEE
    ) as any;
    await factory.waitForDeployment();

    // Deploy mock token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const saleToken = await MockERC20Factory.deploy("Sale Token", "SALE", 18) as any;
    await saleToken.waitForDeployment();

    // Deploy whitelist
    const WhitelistFactory = await ethers.getContractFactory("Whitelist");
    const whitelist = await WhitelistFactory.deploy(owner.address) as any;
    await whitelist.waitForDeployment();

    return {
      factory,
      saleToken,
      whitelist,
      owner,
      feeCollector,
      creator1,
      creator2,
      user1,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      const { factory, owner, feeCollector } = await loadFixture(
        deployFactoryFixture
      );

      expect(await factory.owner()).to.equal(owner.address);
      expect(await factory.feeCollector()).to.equal(feeCollector.address);
      expect(await factory.platformFee()).to.equal(PLATFORM_FEE);
    });

    it("Should revert if fee collector is zero address", async function () {
      const [owner] = await ethers.getSigners();
      const FactoryContract = await ethers.getContractFactory("LaunchpadFactory");

      await expect(
        FactoryContract.deploy(owner.address, ethers.ZeroAddress, PLATFORM_FEE)
      ).to.be.revertedWithCustomError(FactoryContract, "InvalidAddress");
    });

    it("Should revert if fee is too high", async function () {
      const [owner, feeCollector] = await ethers.getSigners();
      const FactoryContract = await ethers.getContractFactory("LaunchpadFactory");

      await expect(
        FactoryContract.deploy(owner.address, feeCollector.address, 1100) // > 10%
      ).to.be.revertedWithCustomError(FactoryContract, "FeeTooHigh");
    });

    it("Should start with zero pools", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      expect(await factory.getPoolCount()).to.equal(0);
    });
  });

  describe("Pool Creation", function () {
    it("Should create a new pool", async function () {
      const { factory, saleToken, creator1 } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await expect(
        factory.connect(creator1).createPool(
          "Test Pool",
          await saleToken.getAddress(),
          TOKEN_PRICE,
          HARD_CAP,
          SOFT_CAP,
          MIN_INVESTMENT,
          MAX_INVESTMENT,
          startTime,
          endTime,
          TGE_PERCENT,
          CLIFF_DURATION,
          VESTING_DURATION
        )
      ).to.emit(factory, "PoolCreated");

      expect(await factory.getPoolCount()).to.equal(1);
    });

    it("Should track creator's pools", async function () {
      const { factory, saleToken, creator1 } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await factory.connect(creator1).createPool(
        "Test Pool 1",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      await factory.connect(creator1).createPool(
        "Test Pool 2",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      const creatorPools = await factory.getPoolsByCreator(creator1.address);
      expect(creatorPools.length).to.equal(2);
    });

    it("Should revert if token is zero address", async function () {
      const { factory, creator1 } = await loadFixture(deployFactoryFixture);

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await expect(
        factory.connect(creator1).createPool(
          "Test Pool",
          ethers.ZeroAddress,
          TOKEN_PRICE,
          HARD_CAP,
          SOFT_CAP,
          MIN_INVESTMENT,
          MAX_INVESTMENT,
          startTime,
          endTime,
          TGE_PERCENT,
          CLIFF_DURATION,
          VESTING_DURATION
        )
      ).to.be.revertedWithCustomError(factory, "InvalidAddress");
    });

    it("Should revert if hard cap is below minimum", async function () {
      const { factory, saleToken, creator1 } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await expect(
        factory.connect(creator1).createPool(
          "Test Pool",
          await saleToken.getAddress(),
          TOKEN_PRICE,
          ethers.parseEther("0.01"), // Below 0.1 ETH minimum
          ethers.parseEther("0.005"),
          MIN_INVESTMENT,
          MAX_INVESTMENT,
          startTime,
          endTime,
          TGE_PERCENT,
          CLIFF_DURATION,
          VESTING_DURATION
        )
      ).to.be.revertedWithCustomError(factory, "HardCapTooLow");
    });

    it("Should revert if start time is in the past", async function () {
      const { factory, saleToken, creator1 } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) - 3600; // Past
      const endTime = startTime + 7 * 24 * 60 * 60;

      await expect(
        factory.connect(creator1).createPool(
          "Test Pool",
          await saleToken.getAddress(),
          TOKEN_PRICE,
          HARD_CAP,
          SOFT_CAP,
          MIN_INVESTMENT,
          MAX_INVESTMENT,
          startTime,
          endTime,
          TGE_PERCENT,
          CLIFF_DURATION,
          VESTING_DURATION
        )
      ).to.be.revertedWithCustomError(factory, "InvalidTime");
    });

    it("Should revert if duration exceeds maximum", async function () {
      const { factory, saleToken, creator1 } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 60 * 24 * 60 * 60; // 60 days > 30 days max

      await expect(
        factory.connect(creator1).createPool(
          "Test Pool",
          await saleToken.getAddress(),
          TOKEN_PRICE,
          HARD_CAP,
          SOFT_CAP,
          MIN_INVESTMENT,
          MAX_INVESTMENT,
          startTime,
          endTime,
          TGE_PERCENT,
          CLIFF_DURATION,
          VESTING_DURATION
        )
      ).to.be.revertedWithCustomError(factory, "DurationTooLong");
    });

    it("Should assign default whitelist to new pool", async function () {
      const { factory, saleToken, whitelist, creator1, owner } =
        await loadFixture(deployFactoryFixture);

      // Set default whitelist
      await factory.connect(owner).setDefaultWhitelist(await whitelist.getAddress());

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      const tx = await factory.connect(creator1).createPool(
        "Test Pool",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.fragment?.name === "PoolCreated"
      );

      // Pool should have whitelist set
      const pools = await factory.getAllPools();
      const poolAddress = pools[0];
      const pool = await ethers.getContractAt("IDOPool", poolAddress) as any;

      expect(await pool.whitelist()).to.equal(await whitelist.getAddress());
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).setPlatformFee(300);
      expect(await factory.platformFee()).to.equal(300);
    });

    it("Should revert if fee too high", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(owner).setPlatformFee(1100)
      ).to.be.revertedWithCustomError(factory, "FeeTooHigh");
    });

    it("Should update fee collector", async function () {
      const { factory, owner, user1 } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).setFeeCollector(user1.address);
      expect(await factory.feeCollector()).to.equal(user1.address);
    });

    it("Should update min hard cap", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      await factory.connect(owner).setMinHardCap(ethers.parseEther("1"));
      expect(await factory.minHardCap()).to.equal(ethers.parseEther("1"));
    });

    it("Should update max duration", async function () {
      const { factory, owner } = await loadFixture(deployFactoryFixture);

      const newDuration = 60 * 24 * 60 * 60; // 60 days
      await factory.connect(owner).setMaxDuration(newDuration);
      expect(await factory.maxDuration()).to.equal(newDuration);
    });

    it("Should set pool status", async function () {
      const { factory, saleToken, creator1, owner } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await factory.connect(creator1).createPool(
        "Test Pool",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      const pools = await factory.getAllPools();
      const poolAddress = pools[0];

      await factory.connect(owner).setPoolStatus(poolAddress, false);

      const details = await factory.getPoolDetails(poolAddress);
      expect(details.isActive).to.equal(false);
    });

    it("Should revert if non-owner calls admin functions", async function () {
      const { factory, creator1 } = await loadFixture(deployFactoryFixture);

      await expect(
        factory.connect(creator1).setPlatformFee(300)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });
  });

  describe("View Functions", function () {
    it("Should return all pools", async function () {
      const { factory, saleToken, creator1, creator2 } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await factory.connect(creator1).createPool(
        "Pool 1",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      await factory.connect(creator2).createPool(
        "Pool 2",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      const allPools = await factory.getAllPools();
      expect(allPools.length).to.equal(2);
    });

    it("Should return active pools only", async function () {
      const { factory, saleToken, creator1, owner } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await factory.connect(creator1).createPool(
        "Pool 1",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      await factory.connect(creator1).createPool(
        "Pool 2",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      const pools = await factory.getAllPools();
      await factory.connect(owner).setPoolStatus(pools[0], false);

      const activePools = await factory.getActivePools();
      expect(activePools.length).to.equal(1);
    });

    it("Should check if address is a pool", async function () {
      const { factory, saleToken, creator1, user1 } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await factory.connect(creator1).createPool(
        "Test Pool",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      const pools = await factory.getAllPools();

      expect(await factory.isPool(pools[0])).to.equal(true);
      expect(await factory.isPool(user1.address)).to.equal(false);
    });

    it("Should return pool details", async function () {
      const { factory, saleToken, creator1 } = await loadFixture(
        deployFactoryFixture
      );

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await factory.connect(creator1).createPool(
        "Test Pool",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      const pools = await factory.getAllPools();
      const details = await factory.getPoolDetails(pools[0]);

      expect(details.name).to.equal("Test Pool");
      expect(details.saleToken).to.equal(await saleToken.getAddress());
      expect(details.hardCap).to.equal(HARD_CAP);
      expect(details.creator).to.equal(creator1.address);
      expect(details.isActive).to.equal(true);
    });
  });

  describe("Integration", function () {
    it("Should create pool and allow investment", async function () {
      const { factory, saleToken, whitelist, creator1, user1, owner } =
        await loadFixture(deployFactoryFixture);

      // Set default whitelist
      await factory.connect(owner).setDefaultWhitelist(await whitelist.getAddress());

      // Add user to whitelist
      await whitelist.connect(owner).addToWhitelist(user1.address);

      const startTime = (await time.latest()) + 3600;
      const endTime = startTime + 7 * 24 * 60 * 60;

      await factory.connect(creator1).createPool(
        "Integration Pool",
        await saleToken.getAddress(),
        TOKEN_PRICE,
        HARD_CAP,
        SOFT_CAP,
        MIN_INVESTMENT,
        MAX_INVESTMENT,
        startTime,
        endTime,
        TGE_PERCENT,
        CLIFF_DURATION,
        VESTING_DURATION
      );

      const pools = await factory.getAllPools();
      const poolAddress = pools[0];
      const pool = await ethers.getContractAt("IDOPool", poolAddress) as any;

      // Move to sale start
      await time.increaseTo(startTime);

      // Invest
      await expect(
        pool.connect(user1).invest({ value: ethers.parseEther("1") })
      ).to.emit(pool, "Investment");

      expect(await pool.investments(user1.address)).to.equal(
        ethers.parseEther("1")
      );
    });
  });
});
