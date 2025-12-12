import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("IDOPool", function () {
  // Constants for testing
  const TOKEN_PRICE = ethers.parseEther("0.001"); // 0.001 ETH per token
  const HARD_CAP = ethers.parseEther("100");
  const SOFT_CAP = ethers.parseEther("50");
  const MIN_INVESTMENT = ethers.parseEther("0.1");
  const MAX_INVESTMENT = ethers.parseEther("10");
  const TGE_PERCENT = 20; // 20% unlocked at TGE
  const CLIFF_DURATION = 30 * 24 * 60 * 60; // 30 days
  const VESTING_DURATION = 180 * 24 * 60 * 60; // 180 days

  async function deployIDOPoolFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy mock token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const saleToken = await MockERC20Factory.deploy("Sale Token", "SALE", 18) as any;
    await saleToken.waitForDeployment();

    // Deploy whitelist
    const WhitelistFactory = await ethers.getContractFactory("Whitelist");
    const whitelist = await WhitelistFactory.deploy(owner.address) as any;
    await whitelist.waitForDeployment();

    // Calculate times
    const startTime = (await time.latest()) + 3600; // 1 hour from now
    const endTime = startTime + 7 * 24 * 60 * 60; // 7 days duration

    // Deploy IDO Pool
    const IDOPoolFactory = await ethers.getContractFactory("IDOPool");
    const idoPool = await IDOPoolFactory.deploy(
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
      VESTING_DURATION,
      owner.address
    ) as any;
    await idoPool.waitForDeployment();

    // Mint tokens to pool for distribution
    const tokensToMint = ethers.parseEther("1000000");
    await saleToken.mint(await idoPool.getAddress(), tokensToMint);

    // Whitelist users
    await whitelist.addToWhitelist(user1.address);
    await whitelist.addToWhitelist(user2.address);
    await whitelist.addToWhitelist(user3.address);

    // Set whitelist on pool
    await idoPool.setWhitelist(await whitelist.getAddress(), true);

    return {
      idoPool,
      saleToken,
      whitelist,
      owner,
      user1,
      user2,
      user3,
      startTime,
      endTime,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      const { idoPool, saleToken, owner } = await loadFixture(
        deployIDOPoolFixture
      );

      expect(await idoPool.saleToken()).to.equal(await saleToken.getAddress());
      expect(await idoPool.tokenPrice()).to.equal(TOKEN_PRICE);
      expect(await idoPool.hardCap()).to.equal(HARD_CAP);
      expect(await idoPool.softCap()).to.equal(SOFT_CAP);
      expect(await idoPool.owner()).to.equal(owner.address);
    });

    it("Should start with zero total raised", async function () {
      const { idoPool } = await loadFixture(deployIDOPoolFixture);
      expect(await idoPool.totalRaised()).to.equal(0);
    });

    it("Should not be finalized on deploy", async function () {
      const { idoPool } = await loadFixture(deployIDOPoolFixture);
      expect(await idoPool.isFinalized()).to.equal(false);
    });
  });

  describe("Investment", function () {
    it("Should revert if sale not started", async function () {
      const { idoPool, user1 } = await loadFixture(deployIDOPoolFixture);

      await expect(
        idoPool.connect(user1).invest({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(idoPool, "SaleNotActive");
    });

    it("Should allow investment during sale period", async function () {
      const { idoPool, user1, startTime } = await loadFixture(
        deployIDOPoolFixture
      );

      // Move to sale start
      await time.increaseTo(startTime);

      const investAmount = ethers.parseEther("1");
      await expect(idoPool.connect(user1).invest({ value: investAmount }))
        .to.emit(idoPool, "Investment")
        .withArgs(user1.address, investAmount);

      expect(await idoPool.totalRaised()).to.equal(investAmount);
      expect(await idoPool.investments(user1.address)).to.equal(investAmount);
    });

    it("Should revert if below minimum investment", async function () {
      const { idoPool, user1, startTime } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);

      await expect(
        idoPool.connect(user1).invest({ value: ethers.parseEther("0.05") })
      ).to.be.revertedWithCustomError(idoPool, "InvalidAmount");
    });

    it("Should revert if above maximum investment", async function () {
      const { idoPool, user1, startTime } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);

      await expect(
        idoPool.connect(user1).invest({ value: ethers.parseEther("15") })
      ).to.be.revertedWithCustomError(idoPool, "ExceedsMaxInvestment");
    });

    it("Should revert if not whitelisted when whitelist is enabled", async function () {
      const { idoPool, owner, startTime } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);

      // Owner is not whitelisted
      await expect(
        idoPool.connect(owner).invest({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(idoPool, "NotWhitelisted");
    });

    it("Should allow multiple investments from same user", async function () {
      const { idoPool, user1, startTime } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);

      await idoPool.connect(user1).invest({ value: ethers.parseEther("1") });
      await idoPool.connect(user1).invest({ value: ethers.parseEther("2") });

      expect(await idoPool.investments(user1.address)).to.equal(
        ethers.parseEther("3")
      );
    });

    it("Should revert if hard cap exceeded", async function () {
      const { idoPool, user1, user2, user3, whitelist, startTime, owner } =
        await loadFixture(deployIDOPoolFixture);

      await time.increaseTo(startTime);

      // Temporarily increase max investment
      await idoPool.connect(owner).updateLimits(MIN_INVESTMENT, HARD_CAP);

      // Multiple users invest
      await idoPool.connect(user1).invest({ value: ethers.parseEther("40") });
      await idoPool.connect(user2).invest({ value: ethers.parseEther("40") });
      await idoPool.connect(user3).invest({ value: ethers.parseEther("20") });

      // Add owner to whitelist for this test
      await whitelist.addToWhitelist(owner.address);

      // This should exceed hard cap
      await expect(
        idoPool.connect(owner).invest({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(idoPool, "ExceedsHardCap");
    });
  });

  describe("Token Claiming", function () {
    it("Should allow claiming after finalization", async function () {
      const { idoPool, saleToken, user1, user2, startTime, endTime, owner } =
        await loadFixture(deployIDOPoolFixture);

      await time.increaseTo(startTime);

      // Multiple users invest to reach soft cap
      await idoPool.connect(user1).invest({ value: ethers.parseEther("30") });
      await idoPool.connect(user2).invest({ value: ethers.parseEther("30") });

      // Move past end time
      await time.increaseTo(endTime + 1);

      // Finalize
      await idoPool.connect(owner).finalize();

      // Check claimable amount
      const investment = await idoPool.investments(user1.address);
      const tokenAmount = (investment * ethers.parseEther("1")) / TOKEN_PRICE;
      const tgeAmount = (tokenAmount * BigInt(TGE_PERCENT)) / BigInt(100);

      // User1 claims tokens
      await expect(idoPool.connect(user1).claim()).to.emit(
        idoPool,
        "TokensClaimed"
      );

      // Check token balance
      expect(await saleToken.balanceOf(user1.address)).to.be.gte(tgeAmount);
    });

    it("Should revert if claiming before finalization", async function () {
      const { idoPool, user1, startTime } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(user1).invest({ value: ethers.parseEther("1") });

      await expect(
        idoPool.connect(user1).claim()
      ).to.be.revertedWithCustomError(idoPool, "SaleNotFinalized");
    });

    it("Should revert if no investment", async function () {
      const { idoPool, user1, user2, startTime, endTime, owner } =
        await loadFixture(deployIDOPoolFixture);

      await time.increaseTo(startTime);
      await idoPool.connect(user2).invest({ value: ethers.parseEther("60") });

      await time.increaseTo(endTime + 1);
      await idoPool.connect(owner).finalize();

      // User1 didn't invest
      await expect(
        idoPool.connect(user1).claim()
      ).to.be.revertedWithCustomError(idoPool, "NoInvestment");
    });
  });

  describe("Refunds", function () {
    it("Should allow refunds if soft cap not reached", async function () {
      const { idoPool, user1, startTime, endTime, owner } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);

      const investAmount = ethers.parseEther("10");
      await idoPool.connect(user1).invest({ value: investAmount });

      // Move past end time (soft cap not reached)
      await time.increaseTo(endTime + 1);

      // Finalize
      await idoPool.connect(owner).finalize();

      // Check refund
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      await idoPool.connect(user1).refund();
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("Should revert refund if soft cap reached", async function () {
      const { idoPool, user1, user2, startTime, endTime, owner } =
        await loadFixture(deployIDOPoolFixture);

      await time.increaseTo(startTime);

      // Invest enough to reach soft cap
      await idoPool.connect(user1).invest({ value: ethers.parseEther("30") });
      await idoPool.connect(user2).invest({ value: ethers.parseEther("30") });

      await time.increaseTo(endTime + 1);
      await idoPool.connect(owner).finalize();

      await expect(
        idoPool.connect(user1).refund()
      ).to.be.revertedWithCustomError(idoPool, "RefundsNotEnabled");
    });
  });

  describe("Finalization", function () {
    it("Should finalize successfully after sale ends", async function () {
      const { idoPool, user1, user2, startTime, endTime, owner } =
        await loadFixture(deployIDOPoolFixture);

      await time.increaseTo(startTime);
      await idoPool.connect(user1).invest({ value: ethers.parseEther("30") });
      await idoPool.connect(user2).invest({ value: ethers.parseEther("30") });

      await time.increaseTo(endTime + 1);

      await expect(idoPool.connect(owner).finalize()).to.emit(
        idoPool,
        "SaleFinalized"
      );

      expect(await idoPool.isFinalized()).to.equal(true);
    });

    it("Should revert if sale not ended", async function () {
      const { idoPool, user1, startTime, owner } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(user1).invest({ value: ethers.parseEther("30") });

      await expect(
        idoPool.connect(owner).finalize()
      ).to.be.revertedWithCustomError(idoPool, "SaleNotEnded");
    });

    it("Should revert if not owner", async function () {
      const { idoPool, user1, startTime, endTime } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(user1).invest({ value: ethers.parseEther("30") });

      await time.increaseTo(endTime + 1);

      await expect(
        idoPool.connect(user1).finalize()
      ).to.be.revertedWithCustomError(idoPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Admin Functions", function () {
    it("Should update investment limits", async function () {
      const { idoPool, owner } = await loadFixture(deployIDOPoolFixture);

      const newMin = ethers.parseEther("0.5");
      const newMax = ethers.parseEther("20");

      await idoPool.connect(owner).updateLimits(newMin, newMax);

      expect(await idoPool.minInvestment()).to.equal(newMin);
      expect(await idoPool.maxInvestment()).to.equal(newMax);
    });

    it("Should allow emergency withdraw", async function () {
      const { idoPool, user1, startTime, owner } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(user1).invest({ value: ethers.parseEther("10") });

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await idoPool.connect(owner).emergencyWithdraw();
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("View Functions", function () {
    it("Should return correct pool info", async function () {
      const { idoPool, saleToken, startTime, endTime } = await loadFixture(
        deployIDOPoolFixture
      );

      const poolInfo = await idoPool.getPoolInfo();

      expect(poolInfo[0]).to.equal(await saleToken.getAddress());
      expect(poolInfo[1]).to.equal(TOKEN_PRICE);
      expect(poolInfo[2]).to.equal(HARD_CAP);
      expect(poolInfo[3]).to.equal(SOFT_CAP);
      expect(poolInfo[4]).to.equal(0); // totalRaised
      expect(poolInfo[5]).to.equal(startTime);
      expect(poolInfo[6]).to.equal(endTime);
    });

    it("Should correctly identify sale phases", async function () {
      const { idoPool, startTime, endTime } = await loadFixture(
        deployIDOPoolFixture
      );

      // Before start
      expect(await idoPool.isSaleActive()).to.equal(false);

      // During sale
      await time.increaseTo(startTime);
      expect(await idoPool.isSaleActive()).to.equal(true);

      // After end
      await time.increaseTo(endTime + 1);
      expect(await idoPool.isSaleActive()).to.equal(false);
    });
  });
});
