import { expect } from "chai";
import { ethers } from "hardhat";
import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("TokenVesting", function () {
  const ONE_DAY = 24 * 60 * 60;
  const ONE_MONTH = 30 * ONE_DAY;
  const TOTAL_AMOUNT = ethers.parseEther("10000");
  const TGE_PERCENT = 20; // 20%
  const CLIFF_DURATION = ONE_MONTH; // 30 days
  const VESTING_DURATION = 6 * ONE_MONTH; // 180 days

  async function deployVestingFixture() {
    const [owner, beneficiary1, beneficiary2, newBeneficiary] =
      await ethers.getSigners();

    // Deploy mock token
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20Factory.deploy("Vesting Token", "VEST", 18) as any;
    await token.waitForDeployment();

    // Deploy vesting contract
    const TokenVestingFactory = await ethers.getContractFactory("TokenVesting");
    const vesting = await TokenVestingFactory.deploy(
      await token.getAddress(),
      owner.address
    ) as any;
    await vesting.waitForDeployment();

    // Mint tokens to vesting contract
    await token.mint(await vesting.getAddress(), ethers.parseEther("1000000"));

    return {
      vesting,
      token,
      owner,
      beneficiary1,
      beneficiary2,
      newBeneficiary,
    };
  }

  describe("Deployment", function () {
    it("Should deploy with correct token", async function () {
      const { vesting, token } = await loadFixture(deployVestingFixture);
      expect(await vesting.token()).to.equal(await token.getAddress());
    });

    it("Should have zero schedules initially", async function () {
      const { vesting } = await loadFixture(deployVestingFixture);
      expect(await vesting.getVestingScheduleCount()).to.equal(0);
    });
  });

  describe("Creating Vesting Schedules", function () {
    it("Should create a vesting schedule", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await expect(
        vesting.connect(owner).createVestingSchedule(
          beneficiary1.address,
          TOTAL_AMOUNT,
          TGE_PERCENT,
          startTime,
          CLIFF_DURATION,
          VESTING_DURATION,
          true // revocable
        )
      ).to.emit(vesting, "VestingScheduleCreated");

      expect(await vesting.getVestingScheduleCount()).to.equal(1);
    });

    it("Should revert if beneficiary is zero address", async function () {
      const { vesting, owner } = await loadFixture(deployVestingFixture);

      const startTime = await time.latest();

      await expect(
        vesting.connect(owner).createVestingSchedule(
          ethers.ZeroAddress,
          TOTAL_AMOUNT,
          TGE_PERCENT,
          startTime,
          CLIFF_DURATION,
          VESTING_DURATION,
          true
        )
      ).to.be.revertedWithCustomError(vesting, "InvalidAddress");
    });

    it("Should revert if amount is zero", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await expect(
        vesting.connect(owner).createVestingSchedule(
          beneficiary1.address,
          0,
          TGE_PERCENT,
          startTime,
          CLIFF_DURATION,
          VESTING_DURATION,
          true
        )
      ).to.be.revertedWithCustomError(vesting, "InvalidAmount");
    });

    it("Should revert if TGE percent > 100", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await expect(
        vesting.connect(owner).createVestingSchedule(
          beneficiary1.address,
          TOTAL_AMOUNT,
          101, // > 100%
          startTime,
          CLIFF_DURATION,
          VESTING_DURATION,
          true
        )
      ).to.be.revertedWithCustomError(vesting, "InvalidPercentage");
    });

    it("Should allow TGE of 100%", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await expect(
        vesting.connect(owner).createVestingSchedule(
          beneficiary1.address,
          TOTAL_AMOUNT,
          100, // 100% TGE
          startTime,
          0, // No cliff needed
          0, // No vesting needed
          true
        )
      ).to.emit(vesting, "VestingScheduleCreated");
    });

    it("Should create multiple schedules for same beneficiary", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        10,
        startTime,
        ONE_MONTH * 2,
        ONE_MONTH * 12,
        true
      );

      const scheduleCount = await vesting.getVestingScheduleCountByBeneficiary(
        beneficiary1.address
      );
      expect(scheduleCount).to.equal(2);
    });
  });

  describe("TGE Release", function () {
    it("Should allow immediate TGE claim", async function () {
      const { vesting, token, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      const tgeAmount = (TOTAL_AMOUNT * BigInt(TGE_PERCENT)) / BigInt(100);

      const releasable = await vesting.computeReleasableAmount(scheduleId);
      expect(releasable).to.equal(tgeAmount);

      await expect(vesting.connect(beneficiary1).release(scheduleId))
        .to.emit(vesting, "TokensReleased")
        .withArgs(beneficiary1.address, tgeAmount);

      expect(await token.balanceOf(beneficiary1.address)).to.equal(tgeAmount);
    });
  });

  describe("Vesting Calculation", function () {
    it("Should not vest during cliff period", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      // Move to middle of cliff
      await time.increase(CLIFF_DURATION / 2);

      const releasable = await vesting.computeReleasableAmount(scheduleId);
      const tgeAmount = (TOTAL_AMOUNT * BigInt(TGE_PERCENT)) / BigInt(100);

      // Only TGE should be releasable during cliff
      expect(releasable).to.equal(tgeAmount);
    });

    it("Should vest linearly after cliff", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      const tgeAmount = (TOTAL_AMOUNT * BigInt(TGE_PERCENT)) / BigInt(100);
      const vestableAmount = TOTAL_AMOUNT - tgeAmount;

      // Move past cliff + half vesting
      await time.increase(CLIFF_DURATION + VESTING_DURATION / 2);

      const releasable = await vesting.computeReleasableAmount(scheduleId);

      // Should be TGE + ~50% of vestable amount
      const expectedVested = vestableAmount / BigInt(2);
      const expectedTotal = tgeAmount + expectedVested;

      // Allow small margin for timing
      expect(releasable).to.be.closeTo(expectedTotal, ethers.parseEther("1"));
    });

    it("Should fully vest after vesting duration", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      // Move past full vesting period
      await time.increase(CLIFF_DURATION + VESTING_DURATION + 1);

      const releasable = await vesting.computeReleasableAmount(scheduleId);
      expect(releasable).to.equal(TOTAL_AMOUNT);
    });
  });

  describe("Token Release", function () {
    it("Should release correct amounts over time", async function () {
      const { vesting, token, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      // Release TGE
      await vesting.connect(beneficiary1).release(scheduleId);
      const tgeAmount = (TOTAL_AMOUNT * BigInt(TGE_PERCENT)) / BigInt(100);
      expect(await token.balanceOf(beneficiary1.address)).to.equal(tgeAmount);

      // Move past cliff + full vesting
      await time.increase(CLIFF_DURATION + VESTING_DURATION + 1);

      // Release remaining
      await vesting.connect(beneficiary1).release(scheduleId);
      expect(await token.balanceOf(beneficiary1.address)).to.equal(
        TOTAL_AMOUNT
      );
    });

    it("Should revert if nothing to release", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      // Release TGE
      await vesting.connect(beneficiary1).release(scheduleId);

      // Try to release again immediately (still in cliff)
      await expect(
        vesting.connect(beneficiary1).release(scheduleId)
      ).to.be.revertedWithCustomError(vesting, "NothingToRelease");
    });
  });

  describe("Revocation", function () {
    it("Should revoke schedule and return unvested tokens", async function () {
      const { vesting, token, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();
      const vestingBalance = await token.balanceOf(await vesting.getAddress());

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      // Move to middle of vesting
      await time.increase(CLIFF_DURATION + VESTING_DURATION / 2);

      // Revoke
      await expect(vesting.connect(owner).revoke(scheduleId)).to.emit(
        vesting,
        "VestingScheduleRevoked"
      );

      // Beneficiary can still claim vested tokens
      const releasable = await vesting.computeReleasableAmount(scheduleId);
      expect(releasable).to.be.gt(0);

      // But no more will vest
      await time.increase(VESTING_DURATION);
      const newReleasable = await vesting.computeReleasableAmount(scheduleId);
      expect(newReleasable).to.equal(releasable);
    });

    it("Should revert if not revocable", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        false // Not revocable
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      await expect(
        vesting.connect(owner).revoke(scheduleId)
      ).to.be.revertedWithCustomError(vesting, "NotRevocable");
    });

    it("Should revert if already revoked", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      await vesting.connect(owner).revoke(scheduleId);

      await expect(
        vesting.connect(owner).revoke(scheduleId)
      ).to.be.revertedWithCustomError(vesting, "AlreadyRevoked");
    });
  });

  describe("Beneficiary Transfer", function () {
    it("Should transfer schedule to new beneficiary", async function () {
      const { vesting, beneficiary1, newBeneficiary, owner } =
        await loadFixture(deployVestingFixture);

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      await expect(
        vesting
          .connect(beneficiary1)
          .transferBeneficiary(scheduleId, newBeneficiary.address)
      ).to.emit(vesting, "BeneficiaryTransferred");

      const schedule = await vesting.getVestingSchedule(scheduleId);
      expect(schedule.beneficiary).to.equal(newBeneficiary.address);
    });

    it("Should revert if not current beneficiary", async function () {
      const { vesting, beneficiary1, beneficiary2, newBeneficiary, owner } =
        await loadFixture(deployVestingFixture);

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      await expect(
        vesting
          .connect(beneficiary2)
          .transferBeneficiary(scheduleId, newBeneficiary.address)
      ).to.be.revertedWithCustomError(vesting, "NotBeneficiary");
    });
  });

  describe("View Functions", function () {
    it("Should return correct vesting schedule", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      const schedule = await vesting.getVestingSchedule(scheduleId);

      expect(schedule.beneficiary).to.equal(beneficiary1.address);
      expect(schedule.totalAmount).to.equal(TOTAL_AMOUNT);
      expect(schedule.tgePercent).to.equal(TGE_PERCENT);
      expect(schedule.cliffDuration).to.equal(CLIFF_DURATION);
      expect(schedule.vestingDuration).to.equal(VESTING_DURATION);
      expect(schedule.revocable).to.equal(true);
      expect(schedule.revoked).to.equal(false);
    });

    it("Should compute correct schedule ID", async function () {
      const { vesting, beneficiary1, owner } = await loadFixture(
        deployVestingFixture
      );

      const startTime = await time.latest();

      await vesting.connect(owner).createVestingSchedule(
        beneficiary1.address,
        TOTAL_AMOUNT,
        TGE_PERCENT,
        startTime,
        CLIFF_DURATION,
        VESTING_DURATION,
        true
      );

      const scheduleId = await vesting.computeVestingScheduleId(
        beneficiary1.address,
        0
      );

      // Schedule ID should be deterministic
      const expectedId = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["address", "uint256"],
          [beneficiary1.address, 0]
        )
      );

      expect(scheduleId).to.equal(expectedId);
    });
  });
});
