// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenVesting
 * @author CryptoLaunch Team
 * @notice Manages token vesting schedules with TGE unlock, cliff, and linear vesting
 * @dev Supports multiple beneficiaries with individual vesting schedules
 */
contract TokenVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Vesting schedule structure
    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 tgeAmount;           // Amount released at TGE
        uint256 tgeTimestamp;        // When TGE happens
        uint256 cliffDuration;       // Cliff period in seconds
        uint256 vestingDuration;     // Total vesting duration after cliff
        uint256 released;            // Amount already released
        bool revoked;                // Whether schedule is revoked
        bool initialized;            // Whether schedule exists
    }

    /// @notice Token being vested
    IERC20 public immutable token;

    /// @notice Mapping of schedule ID to vesting schedule
    mapping(bytes32 => VestingSchedule) public vestingSchedules;

    /// @notice Mapping of beneficiary to their schedule IDs
    mapping(address => bytes32[]) public beneficiarySchedules;

    /// @notice Total amount of tokens held in vesting
    uint256 public totalVestingAmount;

    /// @notice Counter for schedule IDs
    uint256 private scheduleCounter;

    // ============ Events ============

    event VestingScheduleCreated(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 tgeAmount,
        uint256 tgeTimestamp,
        uint256 cliffDuration,
        uint256 vestingDuration
    );

    event TokensReleased(
        bytes32 indexed scheduleId,
        address indexed beneficiary,
        uint256 amount
    );

    event VestingRevoked(bytes32 indexed scheduleId, uint256 refundAmount);

    // ============ Errors ============

    error InvalidBeneficiary();
    error InvalidAmount();
    error InvalidDuration();
    error InvalidTGEPercent();
    error ScheduleNotFound();
    error ScheduleRevoked();
    error NoTokensToRelease();
    error InsufficientTokenBalance();
    error TGENotStarted();

    // ============ Constructor ============

    /**
     * @notice Initialize vesting contract with token address
     * @param _token Address of the ERC20 token to vest
     * @param initialOwner Address of the contract owner
     */
    constructor(address _token, address initialOwner) Ownable(initialOwner) {
        if (_token == address(0)) revert InvalidBeneficiary();
        token = IERC20(_token);
    }

    // ============ External Functions ============

    /**
     * @notice Create a new vesting schedule
     * @param beneficiary Address receiving the vested tokens
     * @param totalAmount Total amount of tokens to vest
     * @param tgePercent Percentage unlocked at TGE (0-100)
     * @param tgeTimestamp When TGE occurs
     * @param cliffDuration Cliff period in seconds
     * @param vestingDuration Linear vesting duration after cliff
     * @return scheduleId Unique identifier for this schedule
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 tgePercent,
        uint256 tgeTimestamp,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external onlyOwner returns (bytes32 scheduleId) {
        if (beneficiary == address(0)) revert InvalidBeneficiary();
        if (totalAmount == 0) revert InvalidAmount();
        if (tgePercent > 100) revert InvalidTGEPercent();
        if (vestingDuration == 0 && tgePercent < 100) revert InvalidDuration();

        // Calculate TGE amount
        uint256 tgeAmount = (totalAmount * tgePercent) / 100;

        // Generate unique schedule ID
        scheduleId = keccak256(
            abi.encodePacked(beneficiary, block.timestamp, scheduleCounter++)
        );

        // Create schedule
        vestingSchedules[scheduleId] = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: totalAmount,
            tgeAmount: tgeAmount,
            tgeTimestamp: tgeTimestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            released: 0,
            revoked: false,
            initialized: true
        });

        beneficiarySchedules[beneficiary].push(scheduleId);
        totalVestingAmount += totalAmount;

        emit VestingScheduleCreated(
            scheduleId,
            beneficiary,
            totalAmount,
            tgeAmount,
            tgeTimestamp,
            cliffDuration,
            vestingDuration
        );

        return scheduleId;
    }

    /**
     * @notice Release vested tokens for a schedule
     * @param scheduleId ID of the vesting schedule
     */
    function release(bytes32 scheduleId) external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        
        if (!schedule.initialized) revert ScheduleNotFound();
        if (schedule.revoked) revert ScheduleRevoked();
        if (block.timestamp < schedule.tgeTimestamp) revert TGENotStarted();

        uint256 releasable = releasableAmount(scheduleId);
        if (releasable == 0) revert NoTokensToRelease();

        schedule.released += releasable;
        totalVestingAmount -= releasable;

        token.safeTransfer(schedule.beneficiary, releasable);

        emit TokensReleased(scheduleId, schedule.beneficiary, releasable);
    }

    /**
     * @notice Revoke a vesting schedule (only owner)
     * @param scheduleId ID of the schedule to revoke
     */
    function revoke(bytes32 scheduleId) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        
        if (!schedule.initialized) revert ScheduleNotFound();
        if (schedule.revoked) revert ScheduleRevoked();

        // Calculate unreleased amount
        uint256 unreleased = schedule.totalAmount - schedule.released;
        
        schedule.revoked = true;
        totalVestingAmount -= unreleased;

        // Transfer unreleased back to owner
        if (unreleased > 0) {
            token.safeTransfer(owner(), unreleased);
        }

        emit VestingRevoked(scheduleId, unreleased);
    }

    /**
     * @notice Deposit tokens for vesting
     * @param amount Amount of tokens to deposit
     */
    function depositTokens(uint256 amount) external onlyOwner {
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Withdraw excess tokens not allocated to vesting
     * @param amount Amount to withdraw
     */
    function withdrawExcess(uint256 amount) external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        uint256 excess = balance > totalVestingAmount ? balance - totalVestingAmount : 0;
        
        if (amount > excess) revert InsufficientTokenBalance();
        
        token.safeTransfer(owner(), amount);
    }

    // ============ View Functions ============

    /**
     * @notice Calculate releasable amount for a schedule
     * @param scheduleId ID of the vesting schedule
     * @return Amount that can be released now
     */
    function releasableAmount(bytes32 scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[scheduleId];
        
        if (!schedule.initialized || schedule.revoked) return 0;
        if (block.timestamp < schedule.tgeTimestamp) return 0;

        uint256 vested = vestedAmount(scheduleId);
        return vested - schedule.released;
    }

    /**
     * @notice Calculate total vested amount for a schedule
     * @param scheduleId ID of the vesting schedule
     * @return Total amount vested so far
     */
    function vestedAmount(bytes32 scheduleId) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[scheduleId];
        
        if (!schedule.initialized) return 0;
        if (block.timestamp < schedule.tgeTimestamp) return 0;

        // TGE amount is immediately available
        uint256 vested = schedule.tgeAmount;

        // Calculate vesting amount (total minus TGE)
        uint256 vestingAmount = schedule.totalAmount - schedule.tgeAmount;
        
        if (vestingAmount == 0) return vested;

        // Check cliff
        uint256 cliffEnd = schedule.tgeTimestamp + schedule.cliffDuration;
        if (block.timestamp < cliffEnd) return vested;

        // Calculate linear vesting
        uint256 vestingEnd = cliffEnd + schedule.vestingDuration;
        
        if (block.timestamp >= vestingEnd) {
            // Fully vested
            vested += vestingAmount;
        } else {
            // Partial vesting
            uint256 elapsed = block.timestamp - cliffEnd;
            vested += (vestingAmount * elapsed) / schedule.vestingDuration;
        }

        return vested;
    }

    /**
     * @notice Get schedule IDs for a beneficiary
     * @param beneficiary Address to check
     * @return Array of schedule IDs
     */
    function getScheduleIds(address beneficiary) external view returns (bytes32[] memory) {
        return beneficiarySchedules[beneficiary];
    }

    /**
     * @notice Get vesting schedule details
     * @param scheduleId ID of the schedule
     * @return VestingSchedule struct
     */
    function getVestingSchedule(bytes32 scheduleId) external view returns (VestingSchedule memory) {
        return vestingSchedules[scheduleId];
    }

    /**
     * @notice Get remaining balance for a schedule
     * @param scheduleId ID of the schedule
     * @return Remaining unvested + unreleased amount
     */
    function getRemainingBalance(bytes32 scheduleId) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[scheduleId];
        if (!schedule.initialized || schedule.revoked) return 0;
        return schedule.totalAmount - schedule.released;
    }
}
