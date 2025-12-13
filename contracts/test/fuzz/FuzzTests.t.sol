// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/IDOPool.sol";
import "../src/TokenVesting.sol";
import "../src/Whitelist.sol";
import "../src/mocks/MockERC20.sol";

/**
 * @title IDOPoolFuzzTest
 * @notice Fuzz tests for IDOPool contract
 * @dev Run with: forge test --match-contract IDOPoolFuzzTest -vvv
 */
contract IDOPoolFuzzTest is Test {
    IDOPool public pool;
    MockERC20 public saleToken;
    Whitelist public whitelist;
    
    address public owner;
    address public investor1;
    address public investor2;
    
    uint256 constant TOKEN_PRICE = 0.001 ether;
    uint256 constant HARD_CAP = 100 ether;
    uint256 constant SOFT_CAP = 50 ether;
    uint256 constant MIN_INVESTMENT = 0.1 ether;
    uint256 constant MAX_INVESTMENT = 10 ether;
    uint256 constant TGE_PERCENT = 20;
    uint256 constant CLIFF_DURATION = 30 days;
    uint256 constant VESTING_DURATION = 180 days;

    function setUp() public {
        owner = address(this);
        investor1 = makeAddr("investor1");
        investor2 = makeAddr("investor2");
        
        // Deploy mock token
        saleToken = new MockERC20("Sale Token", "SALE", 18);
        
        // Deploy whitelist
        whitelist = new Whitelist(owner);
        
        // Calculate times
        uint256 startTime = block.timestamp + 1 hours;
        uint256 endTime = startTime + 7 days;
        
        // Deploy pool
        pool = new IDOPool(
            address(saleToken),
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
            owner
        );
        
        // Mint tokens to pool
        saleToken.mint(address(pool), 1000000 ether);
        
        // Setup whitelist
        whitelist.addToWhitelist(investor1);
        whitelist.addToWhitelist(investor2);
        pool.setWhitelist(address(whitelist), true);
        
        // Fund investors
        vm.deal(investor1, 100 ether);
        vm.deal(investor2, 100 ether);
    }

    // ============================================
    // Fuzz Test 1: Investment amount boundaries
    // ============================================
    function testFuzz_InvestmentBoundaries(uint256 amount) public {
        // Bound amount to reasonable range
        amount = bound(amount, 0.01 ether, 50 ether);
        
        // Warp to sale start
        vm.warp(block.timestamp + 2 hours);
        
        vm.startPrank(investor1);
        
        if (amount < MIN_INVESTMENT) {
            vm.expectRevert();
            pool.invest{value: amount}();
        } else if (amount > MAX_INVESTMENT) {
            vm.expectRevert();
            pool.invest{value: amount}();
        } else {
            pool.invest{value: amount}();
            assertEq(pool.investments(investor1), amount);
        }
        
        vm.stopPrank();
    }

    // ============================================
    // Fuzz Test 2: Multiple investments don't exceed max
    // ============================================
    function testFuzz_MultipleInvestmentsRespectMax(uint256 amount1, uint256 amount2) public {
        amount1 = bound(amount1, MIN_INVESTMENT, MAX_INVESTMENT / 2);
        amount2 = bound(amount2, MIN_INVESTMENT, MAX_INVESTMENT);
        
        vm.warp(block.timestamp + 2 hours);
        
        vm.startPrank(investor1);
        
        // First investment should succeed
        pool.invest{value: amount1}();
        
        // Second investment
        uint256 totalAfter = amount1 + amount2;
        if (totalAfter > MAX_INVESTMENT) {
            vm.expectRevert();
            pool.invest{value: amount2}();
        } else {
            pool.invest{value: amount2}();
            assertEq(pool.investments(investor1), totalAfter);
        }
        
        vm.stopPrank();
    }

    // ============================================
    // Fuzz Test 3: Total raised never exceeds hard cap
    // ============================================
    function testFuzz_TotalRaisedNeverExceedsHardCap(uint256 numInvestors) public {
        numInvestors = bound(numInvestors, 1, 20);
        
        vm.warp(block.timestamp + 2 hours);
        
        for (uint256 i = 0; i < numInvestors; i++) {
            address investor = makeAddr(string(abi.encodePacked("inv", i)));
            whitelist.addToWhitelist(investor);
            vm.deal(investor, MAX_INVESTMENT + 1 ether);
            
            vm.prank(investor);
            
            uint256 remaining = HARD_CAP - pool.totalRaised();
            if (remaining >= MIN_INVESTMENT) {
                uint256 toInvest = remaining > MAX_INVESTMENT ? MAX_INVESTMENT : remaining;
                if (toInvest >= MIN_INVESTMENT) {
                    pool.invest{value: toInvest}();
                }
            }
        }
        
        // Invariant: totalRaised <= HARD_CAP
        assertLe(pool.totalRaised(), HARD_CAP);
    }

    // ============================================
    // Fuzz Test 4: Token allocation calculation
    // ============================================
    function testFuzz_TokenAllocationCorrect(uint256 investAmount) public {
        investAmount = bound(investAmount, MIN_INVESTMENT, MAX_INVESTMENT);
        
        vm.warp(block.timestamp + 2 hours);
        
        vm.prank(investor1);
        pool.invest{value: investAmount}();
        
        // Calculate expected tokens
        uint256 expectedTokens = (investAmount * 1 ether) / TOKEN_PRICE;
        
        // Get investor info and verify allocation
        (uint256 investment, uint256 tokenAllocation, , ) = pool.getInvestorInfo(investor1);
        
        assertEq(investment, investAmount);
        assertEq(tokenAllocation, expectedTokens);
    }

    // ============================================
    // Fuzz Test 5: Time-based access control
    // ============================================
    function testFuzz_TimeBasedAccess(uint256 timeOffset) public {
        timeOffset = bound(timeOffset, 0, 30 days);
        
        uint256 saleStart = block.timestamp + 1 hours;
        
        vm.warp(block.timestamp + timeOffset);
        
        vm.prank(investor1);
        
        if (block.timestamp < saleStart) {
            // Before sale starts
            vm.expectRevert();
            pool.invest{value: 1 ether}();
        } else if (block.timestamp > saleStart + 7 days) {
            // After sale ends
            vm.expectRevert();
            pool.invest{value: 1 ether}();
        }
        // During sale - should work (or may hit other conditions)
    }

    // ============================================
    // Fuzz Test 6: Refund amount matches investment
    // ============================================
    function testFuzz_RefundMatchesInvestment(uint256 investAmount) public {
        investAmount = bound(investAmount, MIN_INVESTMENT, MAX_INVESTMENT);
        
        vm.warp(block.timestamp + 2 hours);
        
        // Invest
        vm.prank(investor1);
        pool.invest{value: investAmount}();
        
        // End sale without reaching soft cap
        vm.warp(block.timestamp + 8 days);
        
        // Finalize
        pool.finalize();
        
        // Record balance before refund
        uint256 balanceBefore = investor1.balance;
        
        // Refund
        vm.prank(investor1);
        pool.refund();
        
        // Check refund amount
        uint256 balanceAfter = investor1.balance;
        assertEq(balanceAfter - balanceBefore, investAmount);
    }

    // ============================================
    // Fuzz Test 7: Cannot double claim
    // ============================================
    function testFuzz_NoDubleClaim(uint256 investAmount) public {
        investAmount = bound(investAmount, MIN_INVESTMENT, MAX_INVESTMENT);
        
        // Get to soft cap with multiple investors
        vm.warp(block.timestamp + 2 hours);
        
        // Investor 1 invests
        vm.prank(investor1);
        pool.invest{value: investAmount}();
        
        // Investor 2 fills to soft cap
        uint256 remaining = SOFT_CAP - pool.totalRaised();
        if (remaining > 0 && remaining >= MIN_INVESTMENT) {
            vm.prank(investor2);
            pool.invest{value: remaining > MAX_INVESTMENT ? MAX_INVESTMENT : remaining}();
        }
        
        // If soft cap not reached, skip test
        if (pool.totalRaised() < SOFT_CAP) return;
        
        // End sale and finalize
        vm.warp(block.timestamp + 8 days);
        pool.finalize();
        
        // First claim should work
        vm.prank(investor1);
        pool.claim();
        
        // Immediate second claim should fail (nothing to claim yet)
        vm.prank(investor1);
        vm.expectRevert();
        pool.claim();
    }

    // ============================================
    // Fuzz Test 8: Investment state consistency
    // ============================================
    function testFuzz_InvestmentStateConsistency(uint256[] calldata amounts) public {
        vm.warp(block.timestamp + 2 hours);
        
        uint256 expectedTotal = 0;
        uint256 successfulInvestments = 0;
        
        for (uint256 i = 0; i < amounts.length && i < 10; i++) {
            address investor = makeAddr(string(abi.encodePacked("investor", i)));
            whitelist.addToWhitelist(investor);
            vm.deal(investor, 100 ether);
            
            uint256 amount = bound(amounts[i], MIN_INVESTMENT, MAX_INVESTMENT);
            
            if (expectedTotal + amount <= HARD_CAP) {
                vm.prank(investor);
                try pool.invest{value: amount}() {
                    expectedTotal += amount;
                    successfulInvestments++;
                } catch {}
            }
        }
        
        // State should be consistent
        assertEq(pool.totalRaised(), expectedTotal);
    }

    // ============================================
    // Fuzz Test 9: Emergency withdraw only by owner
    // ============================================
    function testFuzz_EmergencyWithdrawOnlyOwner(address caller) public {
        vm.assume(caller != owner);
        vm.assume(caller != address(0));
        
        vm.warp(block.timestamp + 2 hours);
        
        vm.prank(investor1);
        pool.invest{value: 1 ether}();
        
        // Non-owner cannot emergency withdraw
        vm.prank(caller);
        vm.expectRevert();
        pool.emergencyWithdraw();
        
        // Owner can
        uint256 balanceBefore = owner.balance;
        pool.emergencyWithdraw();
        assertGt(owner.balance, balanceBefore);
    }

    // ============================================
    // Fuzz Test 10: Whitelist enforcement
    // ============================================
    function testFuzz_WhitelistEnforcement(address randomAddr) public {
        vm.assume(randomAddr != investor1);
        vm.assume(randomAddr != investor2);
        vm.assume(randomAddr != address(0));
        vm.assume(randomAddr.code.length == 0); // Not a contract
        
        vm.warp(block.timestamp + 2 hours);
        vm.deal(randomAddr, 10 ether);
        
        // Non-whitelisted address should fail
        vm.prank(randomAddr);
        vm.expectRevert();
        pool.invest{value: 1 ether}();
        
        // After whitelisting, should work
        whitelist.addToWhitelist(randomAddr);
        
        vm.prank(randomAddr);
        pool.invest{value: 1 ether}();
        
        assertEq(pool.investments(randomAddr), 1 ether);
    }
}

/**
 * @title TokenVestingFuzzTest
 * @notice Fuzz tests for TokenVesting contract
 * @dev Run with: forge test --match-contract TokenVestingFuzzTest -vvv
 */
contract TokenVestingFuzzTest is Test {
    TokenVesting public vesting;
    MockERC20 public token;
    
    address public owner;
    address public beneficiary;
    
    uint256 constant TOTAL_AMOUNT = 10000 ether;
    uint256 constant TGE_PERCENT = 20;
    uint256 constant CLIFF_DURATION = 30 days;
    uint256 constant VESTING_DURATION = 180 days;

    function setUp() public {
        owner = address(this);
        beneficiary = makeAddr("beneficiary");
        
        // Deploy token
        token = new MockERC20("Vesting Token", "VEST", 18);
        
        // Deploy vesting contract
        vesting = new TokenVesting(address(token), owner);
        
        // Mint tokens to vesting contract
        token.mint(address(vesting), 1000000 ether);
    }

    // ============================================
    // Fuzz Test 1: TGE percentage boundaries
    // ============================================
    function testFuzz_TGEPercentBoundaries(uint256 tgePercent) public {
        tgePercent = bound(tgePercent, 0, 150); // Include invalid values
        
        uint256 startTime = block.timestamp;
        
        if (tgePercent > 100) {
            vm.expectRevert();
            vesting.createVestingSchedule(
                beneficiary,
                TOTAL_AMOUNT,
                tgePercent,
                startTime,
                CLIFF_DURATION,
                VESTING_DURATION,
                true
            );
        } else {
            vesting.createVestingSchedule(
                beneficiary,
                TOTAL_AMOUNT,
                tgePercent,
                startTime,
                CLIFF_DURATION,
                VESTING_DURATION,
                true
            );
            
            bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
            
            // TGE should be immediately releasable
            uint256 releasable = vesting.computeReleasableAmount(scheduleId);
            uint256 expectedTGE = (TOTAL_AMOUNT * tgePercent) / 100;
            
            assertEq(releasable, expectedTGE);
        }
    }

    // ============================================
    // Fuzz Test 2: Vesting amount never exceeds total
    // ============================================
    function testFuzz_VestedNeverExceedsTotal(uint256 timeElapsed) public {
        timeElapsed = bound(timeElapsed, 0, 365 days);
        
        uint256 startTime = block.timestamp;
        
        vesting.createVestingSchedule(
            beneficiary,
            TOTAL_AMOUNT,
            TGE_PERCENT,
            startTime,
            CLIFF_DURATION,
            VESTING_DURATION,
            true
        );
        
        bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
        
        vm.warp(block.timestamp + timeElapsed);
        
        uint256 vestedAmount = vesting.computeVestedAmount(scheduleId);
        
        // Invariant: vested <= total
        assertLe(vestedAmount, TOTAL_AMOUNT);
    }

    // ============================================
    // Fuzz Test 3: Linear vesting correctness
    // ============================================
    function testFuzz_LinearVestingCorrectness(uint256 timeInVesting) public {
        // Time after cliff, within vesting period
        timeInVesting = bound(timeInVesting, 0, VESTING_DURATION);
        
        uint256 startTime = block.timestamp;
        
        vesting.createVestingSchedule(
            beneficiary,
            TOTAL_AMOUNT,
            TGE_PERCENT,
            startTime,
            CLIFF_DURATION,
            VESTING_DURATION,
            true
        );
        
        bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
        
        // Move past cliff + time into vesting
        vm.warp(startTime + CLIFF_DURATION + timeInVesting);
        
        uint256 vestedAmount = vesting.computeVestedAmount(scheduleId);
        
        // Calculate expected
        uint256 tgeAmount = (TOTAL_AMOUNT * TGE_PERCENT) / 100;
        uint256 vestingAmount = TOTAL_AMOUNT - tgeAmount;
        uint256 expectedVested = tgeAmount + (vestingAmount * timeInVesting) / VESTING_DURATION;
        
        // Allow small rounding difference
        assertApproxEqAbs(vestedAmount, expectedVested, 1);
    }

    // ============================================
    // Fuzz Test 4: Cliff period blocks vesting
    // ============================================
    function testFuzz_CliffBlocksVesting(uint256 timeInCliff) public {
        timeInCliff = bound(timeInCliff, 1, CLIFF_DURATION - 1);
        
        uint256 startTime = block.timestamp;
        
        vesting.createVestingSchedule(
            beneficiary,
            TOTAL_AMOUNT,
            TGE_PERCENT,
            startTime,
            CLIFF_DURATION,
            VESTING_DURATION,
            true
        );
        
        bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
        
        // Move within cliff period
        vm.warp(startTime + timeInCliff);
        
        uint256 releasable = vesting.computeReleasableAmount(scheduleId);
        uint256 expectedTGE = (TOTAL_AMOUNT * TGE_PERCENT) / 100;
        
        // During cliff, only TGE should be releasable
        assertEq(releasable, expectedTGE);
    }

    // ============================================
    // Fuzz Test 5: Release decreases releasable
    // ============================================
    function testFuzz_ReleaseDecreasesReleasable(uint256 timeElapsed) public {
        timeElapsed = bound(timeElapsed, CLIFF_DURATION + 1, CLIFF_DURATION + VESTING_DURATION);
        
        uint256 startTime = block.timestamp;
        
        vesting.createVestingSchedule(
            beneficiary,
            TOTAL_AMOUNT,
            TGE_PERCENT,
            startTime,
            CLIFF_DURATION,
            VESTING_DURATION,
            true
        );
        
        bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
        
        vm.warp(startTime + timeElapsed);
        
        uint256 releasableBefore = vesting.computeReleasableAmount(scheduleId);
        
        vm.prank(beneficiary);
        vesting.release(scheduleId);
        
        uint256 releasableAfter = vesting.computeReleasableAmount(scheduleId);
        
        // After release, releasable should be 0 (at that moment)
        assertEq(releasableAfter, 0);
        
        // Beneficiary should have received tokens
        assertEq(token.balanceOf(beneficiary), releasableBefore);
    }

    // ============================================
    // Fuzz Test 6: Revocation stops future vesting
    // ============================================
    function testFuzz_RevocationStopsFutureVesting(uint256 revokeTime) public {
        revokeTime = bound(revokeTime, 1, CLIFF_DURATION + VESTING_DURATION / 2);
        
        uint256 startTime = block.timestamp;
        
        vesting.createVestingSchedule(
            beneficiary,
            TOTAL_AMOUNT,
            TGE_PERCENT,
            startTime,
            CLIFF_DURATION,
            VESTING_DURATION,
            true // revocable
        );
        
        bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
        
        vm.warp(startTime + revokeTime);
        
        uint256 vestedAtRevoke = vesting.computeVestedAmount(scheduleId);
        
        // Revoke
        vesting.revoke(scheduleId);
        
        // Move forward
        vm.warp(startTime + CLIFF_DURATION + VESTING_DURATION + 1);
        
        // Vested amount should not increase after revocation
        uint256 vestedAfterRevoke = vesting.computeVestedAmount(scheduleId);
        
        assertEq(vestedAfterRevoke, vestedAtRevoke);
    }

    // ============================================
    // Fuzz Test 7: Non-revocable cannot be revoked
    // ============================================
    function testFuzz_NonRevocableCannotBeRevoked(uint256 revokeTime) public {
        revokeTime = bound(revokeTime, 1, CLIFF_DURATION + VESTING_DURATION);
        
        uint256 startTime = block.timestamp;
        
        vesting.createVestingSchedule(
            beneficiary,
            TOTAL_AMOUNT,
            TGE_PERCENT,
            startTime,
            CLIFF_DURATION,
            VESTING_DURATION,
            false // NOT revocable
        );
        
        bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
        
        vm.warp(startTime + revokeTime);
        
        vm.expectRevert();
        vesting.revoke(scheduleId);
    }

    // ============================================
    // Fuzz Test 8: Total amount consistency
    // ============================================
    function testFuzz_TotalAmountConsistency(uint256 totalAmount) public {
        totalAmount = bound(totalAmount, 1 ether, 100000 ether);
        
        uint256 startTime = block.timestamp;
        
        vesting.createVestingSchedule(
            beneficiary,
            totalAmount,
            TGE_PERCENT,
            startTime,
            CLIFF_DURATION,
            VESTING_DURATION,
            true
        );
        
        bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
        
        // After full vesting period
        vm.warp(startTime + CLIFF_DURATION + VESTING_DURATION + 1);
        
        uint256 vestedAmount = vesting.computeVestedAmount(scheduleId);
        
        // Should be fully vested
        assertEq(vestedAmount, totalAmount);
    }

    // ============================================
    // Fuzz Test 9: Beneficiary transfer
    // ============================================
    function testFuzz_BeneficiaryTransfer(address newBeneficiary) public {
        vm.assume(newBeneficiary != address(0));
        vm.assume(newBeneficiary != beneficiary);
        vm.assume(newBeneficiary.code.length == 0);
        
        uint256 startTime = block.timestamp;
        
        vesting.createVestingSchedule(
            beneficiary,
            TOTAL_AMOUNT,
            TGE_PERCENT,
            startTime,
            CLIFF_DURATION,
            VESTING_DURATION,
            true
        );
        
        bytes32 scheduleId = vesting.computeVestingScheduleId(beneficiary, 0);
        
        // Transfer beneficiary
        vm.prank(beneficiary);
        vesting.transferBeneficiary(scheduleId, newBeneficiary);
        
        // Move past cliff
        vm.warp(startTime + CLIFF_DURATION + VESTING_DURATION / 2);
        
        // New beneficiary should be able to claim
        uint256 releasable = vesting.computeReleasableAmount(scheduleId);
        
        vm.prank(newBeneficiary);
        vesting.release(scheduleId);
        
        assertEq(token.balanceOf(newBeneficiary), releasable);
    }

    // ============================================
    // Fuzz Test 10: Multiple schedules per beneficiary
    // ============================================
    function testFuzz_MultipleSchedules(uint256 numSchedules) public {
        numSchedules = bound(numSchedules, 1, 5);
        
        uint256 startTime = block.timestamp;
        
        for (uint256 i = 0; i < numSchedules; i++) {
            vesting.createVestingSchedule(
                beneficiary,
                TOTAL_AMOUNT / numSchedules,
                TGE_PERCENT,
                startTime + i * 1 days,
                CLIFF_DURATION,
                VESTING_DURATION,
                true
            );
        }
        
        uint256 scheduleCount = vesting.getVestingScheduleCountByBeneficiary(beneficiary);
        assertEq(scheduleCount, numSchedules);
    }
}
