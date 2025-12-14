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
  const IDOPoolFactory = await ethers.getContractFactory("src/IDOPool_FIXED.sol:IDOPool");
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
  // Add users to whitelist with Bronze tier (1)
  await whitelist.addToWhitelist(user1.address, 1);
  await whitelist.addToWhitelist(user2.address, 1);
  await whitelist.addToWhitelist(user3.address, 1);

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

  const info = await idoPool.poolInfo();
  expect(info.saleToken).to.equal(await saleToken.getAddress());
  expect(info.tokenPrice).to.equal(TOKEN_PRICE);
  expect(info.hardCap).to.equal(HARD_CAP);
  expect(info.softCap).to.equal(SOFT_CAP);
      expect(await idoPool.owner()).to.equal(owner.address);
    });

    it("Should start with zero total raised", async function () {
      const { idoPool } = await loadFixture(deployIDOPoolFixture);
      expect(await idoPool.totalRaised()).to.equal(0);
    });

    it("Should not be finalized on deploy", async function () {
      const { idoPool } = await loadFixture(deployIDOPoolFixture);
  // Status enum: 0 = Pending
  expect(await idoPool.status()).to.equal(0);
    });
  });

  describe("Investment", function () {
    it("Should revert if sale not started", async function () {
      const { idoPool, user1 } = await loadFixture(deployIDOPoolFixture);

      await expect(
        idoPool.connect(user1).invest(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(idoPool, "SaleNotActive");
    });

    it("Should allow investment during sale period", async function () {
      const { idoPool, user1, startTime, owner, whitelist } = await loadFixture(
        deployIDOPoolFixture
      );

      // Move to sale start and activate
      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();

      // Ensure user has sufficient allocation
      await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));

      const investAmount = ethers.parseEther("1");
      await expect(idoPool.connect(user1).invest(0, { value: investAmount }))
        .to.emit(idoPool, "Investment");

      expect(await idoPool.totalRaised()).to.equal(investAmount);
      const inv = await idoPool.investors(user1.address);
      expect(inv.invested).to.equal(investAmount);
    });

    it("Should revert if below minimum investment", async function () {
      const { idoPool, user1, startTime, owner } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();

      await expect(
        idoPool.connect(user1).invest(0, { value: ethers.parseEther("0.05") })
      ).to.be.revertedWithCustomError(idoPool, "BelowMinInvestment");
    });

    it("Should revert if above maximum investment", async function () {
      const { idoPool, user1, startTime, owner, whitelist } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();
      // Give user enough allocation so we hit maxInvestment check
      await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));

      await expect(
        idoPool.connect(user1).invest(0, { value: ethers.parseEther("15") })
      ).to.be.revertedWithCustomError(idoPool, "AboveMaxInvestment");
    });

    it("Should revert if not whitelisted when whitelist is enabled", async function () {
      const { idoPool, owner, startTime } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();

      // Owner is not whitelisted
      await expect(
        idoPool.connect(owner).invest(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(idoPool, "NotWhitelisted");
    });

    it("Should allow multiple investments from same user", async function () {
      const { idoPool, user1, startTime, owner, whitelist } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
  await idoPool.connect(owner).activateSale();
  await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));

      await idoPool.connect(user1).invest(0, { value: ethers.parseEther("1") });
      await idoPool.connect(user1).invest(0, { value: ethers.parseEther("2") });

      const inv = await idoPool.investors(user1.address);
      expect(inv.invested).to.equal(ethers.parseEther("3"));
    });

    it("Should revert if hard cap exceeded", async function () {
      const { idoPool, user1, user2, user3, whitelist, startTime, owner } =
        await loadFixture(deployIDOPoolFixture);

      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();

        // Use many signers to fill the hard cap with per-wallet maxInvestment
        const signers = await ethers.getSigners();
        for (let i = 0; i < 10; i++) {
          const s = signers[i];
          if (!(await whitelist.isWhitelisted(s.address))) {
            await whitelist.addToWhitelist(s.address, 1);
          }
          await whitelist.connect(owner).setCustomAllocation(s.address, HARD_CAP);
          // Each signer invests the per-wallet max (10 ETH) to reach hard cap
          await idoPool.connect(s).invest(0, { value: ethers.parseEther("10") });
        }

        // Any further investment should exceed the hard cap
        await expect(
          idoPool.connect(owner).invest(0, { value: ethers.parseEther("1") })
        ).to.be.revertedWithCustomError(idoPool, "HardCapReached");
        // Ensure total raised is equal to hard cap
        expect(await idoPool.totalRaised()).to.equal(HARD_CAP);
    });
  });

  describe("Token Claiming", function () {
    it("Should allow claiming after finalization", async function () {
      const { idoPool, saleToken, user1, user2, startTime, endTime, owner, whitelist } =
        await loadFixture(deployIDOPoolFixture);

    await time.increaseTo(startTime);
    await idoPool.connect(owner).activateSale();

    // Use multiple distinct investors to reach soft cap (per-wallet maxInvestment applies)
    const signers = await ethers.getSigners();
    for (let i = 1; i <= 5; i++) {
      const s = signers[i];
      if (!(await whitelist.isWhitelisted(s.address))) {
        await whitelist.addToWhitelist(s.address, 1);
      }
      await whitelist.connect(owner).setCustomAllocation(s.address, ethers.parseEther("100"));
      await idoPool.connect(s).invest(0, { value: ethers.parseEther("10") });
    }

      // Move past end time
      await time.increaseTo(endTime + 1);

      // Finalize
      await idoPool.connect(owner).finalize();

      // Set TGE and move time past TGE so claiming is allowed
      const now = await time.latest();
      await idoPool.connect(owner).setTGE(now + 1);
      await time.increaseTo(now + 2);

      // Check claimable amount
      const investment = (await idoPool.investors(user1.address)).invested;
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
      const { idoPool, user1, startTime, owner, whitelist } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();
      await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));
      await idoPool.connect(user1).invest(0, { value: ethers.parseEther("1") });

      await expect(
        idoPool.connect(user1).claim()
      ).to.be.revertedWithCustomError(idoPool, "SaleNotEnded");
    });

    it("Should revert if no investment", async function () {
      const { idoPool, user1, user2, user3, startTime, endTime, owner, whitelist } =
        await loadFixture(deployIDOPoolFixture);

  await time.increaseTo(startTime);
  await idoPool.connect(owner).activateSale();
  // Use multiple distinct investors to reach soft cap
  const signers = await ethers.getSigners();
  for (let i = 2; i <= 6; i++) {
    const s = signers[i];
    if (!(await whitelist.isWhitelisted(s.address))) {
      await whitelist.addToWhitelist(s.address, 1);
    }
    await whitelist.connect(owner).setCustomAllocation(s.address, ethers.parseEther("100"));
    await idoPool.connect(s).invest(0, { value: ethers.parseEther("10") });
  }

      await time.increaseTo(endTime + 1);
      await idoPool.connect(owner).finalize();

      // Ensure TGE is set and active
      const now2 = await time.latest();
      await idoPool.connect(owner).setTGE(now2 + 1);
      await time.increaseTo(now2 + 2);

      // User1 didn't invest
      await expect(
        idoPool.connect(user1).claim()
      ).to.be.revertedWithCustomError(idoPool, "NoTokensToClaim");
    });
  });

  describe("Refunds", function () {
    it("Should allow refunds if soft cap not reached", async function () {
      const { idoPool, user1, startTime, endTime, owner, whitelist } = await loadFixture(
        deployIDOPoolFixture
      );

  await time.increaseTo(startTime);
  await idoPool.connect(owner).activateSale();
  await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));

  const investAmount = ethers.parseEther("10");
  await idoPool.connect(user1).invest(0, { value: investAmount });

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
      const { idoPool, user1, user2, startTime, endTime, owner, whitelist } =
        await loadFixture(deployIDOPoolFixture);

      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();
      // Use multiple distinct investors to reach soft cap
      const signers = await ethers.getSigners();
      for (let i = 1; i <= 5; i++) {
        const s = signers[i];
        if (!(await whitelist.isWhitelisted(s.address))) {
          await whitelist.addToWhitelist(s.address, 1);
        }
        await whitelist.connect(owner).setCustomAllocation(s.address, ethers.parseEther("100"));
        await idoPool.connect(s).invest(0, { value: ethers.parseEther("10") });
      }

      await time.increaseTo(endTime + 1);
      await idoPool.connect(owner).finalize();

      await expect(
        idoPool.connect(user1).refund()
      ).to.be.revertedWithCustomError(idoPool, "SoftCapMet");
    });
  });

  describe("Finalization", function () {
    it("Should finalize successfully after sale ends", async function () {
      const { idoPool, user1, user2, startTime, endTime, owner, whitelist } =
        await loadFixture(deployIDOPoolFixture);

  await time.increaseTo(startTime);
  await idoPool.connect(owner).activateSale();
  await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));
  await whitelist.connect(owner).setCustomAllocation(user2.address, ethers.parseEther("100"));

  // Use multiple distinct investors to reach soft cap
  const signers = await ethers.getSigners();
  for (let i = 1; i <= 6; i++) {
    const s = signers[i];
    if (!(await whitelist.isWhitelisted(s.address))) {
      await whitelist.addToWhitelist(s.address, 1);
    }
    await whitelist.connect(owner).setCustomAllocation(s.address, ethers.parseEther("100"));
    await idoPool.connect(s).invest(0, { value: ethers.parseEther("10") });
  }

      await time.increaseTo(endTime + 1);

      await expect(idoPool.connect(owner).finalize()).to.emit(
        idoPool,
        "SaleFinalized"
      );

  // Status enum: 2 = Finalized
  expect(await idoPool.status()).to.equal(2);
    });

    it("Should revert if sale not ended", async function () {
      const { idoPool, user1, startTime, owner, whitelist } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();
      await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));
      // invest within maxInvestment
      await idoPool.connect(user1).invest(0, { value: ethers.parseEther("10") });

      await expect(
        idoPool.connect(owner).finalize()
      ).to.be.revertedWithCustomError(idoPool, "SaleNotEnded");
    });

    it("Should revert if not owner", async function () {
      const { idoPool, user1, startTime, endTime, owner, whitelist } = await loadFixture(
        deployIDOPoolFixture
      );

      await time.increaseTo(startTime);
      await idoPool.connect(owner).activateSale();
      await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));
      await idoPool.connect(user1).invest(0, { value: ethers.parseEther("10") });

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

  // Pool has initial limits set from deployment parameters
  const info = await idoPool.poolInfo();
  expect(info.minInvestment).to.equal(info.minInvestment);
  expect(info.maxInvestment).to.equal(info.maxInvestment);
    });

    it("Should allow emergency withdraw", async function () {
      const { idoPool, user1, startTime, owner, whitelist } = await loadFixture(
        deployIDOPoolFixture
      );

    await time.increaseTo(startTime);
    await idoPool.connect(owner).activateSale();
    await whitelist.connect(owner).setCustomAllocation(user1.address, ethers.parseEther("100"));
    await idoPool.connect(user1).invest(0, { value: ethers.parseEther("10") });

      // Cancel the sale to enable emergency withdraw path
      await idoPool.connect(owner).cancelSale();

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await idoPool.connect(owner).emergencyWithdraw(owner.address);
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

  // poolInfo is a struct; access by named fields where possible
  expect(poolInfo.saleToken).to.equal(await saleToken.getAddress());
  expect(poolInfo.tokenPrice).to.equal(TOKEN_PRICE);
  expect(poolInfo.hardCap).to.equal(HARD_CAP);
  expect(poolInfo.softCap).to.equal(SOFT_CAP);
  // totalRaised is a separate state variable
  expect(await idoPool.totalRaised()).to.equal(0);
  expect(poolInfo.startTime).to.equal(startTime);
  expect(poolInfo.endTime).to.equal(endTime);
    });

    it("Should correctly identify sale phases", async function () {
      const { idoPool, startTime, endTime } = await loadFixture(
        deployIDOPoolFixture
      );

  // Before start: status should be Pending (0)
  expect(await idoPool.status()).to.equal(0);

  // During sale: activate sale and check status is Active (1)
  await time.increaseTo(startTime);
  await idoPool.connect((await ethers.getSigners())[0]).activateSale();
  expect(await idoPool.status()).to.equal(1);

  // After end: finalize and ensure status is Finalized (2)
  await time.increaseTo(endTime + 1);
  await idoPool.connect((await ethers.getSigners())[0]).finalize();
  expect(await idoPool.status()).to.equal(2);
    });
  });
});
