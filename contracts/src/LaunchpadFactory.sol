// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IDOPool.sol";
import "./Whitelist.sol";

/**
 * @title LaunchpadFactory
 * @author CryptoLaunch Team
 * @notice Factory contract for creating and managing IDO pools
 * @dev Deploys new IDOPool instances and tracks all created pools
 */
contract LaunchpadFactory is Ownable, ReentrancyGuard {
    // ============ Structs ============

    struct PoolDetails {
        address poolAddress;
        address saleToken;
        string name;
        uint256 hardCap;
        uint256 startTime;
        uint256 endTime;
        address creator;
        uint256 createdAt;
        bool isActive;
    }

    // ============ State Variables ============

    /// @notice Array of all created pools
    address[] public allPools;

    /// @notice Mapping of pool address to details
    mapping(address => PoolDetails) public poolDetails;

    /// @notice Mapping of creator to their pools
    mapping(address => address[]) public creatorPools;

    /// @notice Default whitelist contract
    Whitelist public defaultWhitelist;

    /// @notice Platform fee percentage (basis points, e.g., 250 = 2.5%)
    uint256 public platformFee;

    /// @notice Fee collector address
    address public feeCollector;

    /// @notice Minimum hard cap for pools
    uint256 public minHardCap;

    /// @notice Maximum pool duration
    uint256 public maxDuration;

    // ============ Events ============

    event PoolCreated(
        address indexed poolAddress,
        address indexed saleToken,
        address indexed creator,
        string name,
        uint256 hardCap,
        uint256 startTime,
        uint256 endTime
    );

    event PoolStatusUpdated(address indexed poolAddress, bool isActive);

    event DefaultWhitelistUpdated(address indexed whitelist);

    event PlatformFeeUpdated(uint256 newFee);

    event FeeCollectorUpdated(address indexed newCollector);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InvalidTime();
    error PoolNotFound();
    error DurationTooLong();
    error HardCapTooLow();
    error FeeTooHigh();

    // ============ Constructor ============

    /**
     * @notice Initialize the factory
     * @param initialOwner Owner address
     * @param _feeCollector Fee collector address
     * @param _platformFee Platform fee in basis points
     */
    constructor(
        address initialOwner,
        address _feeCollector,
        uint256 _platformFee
    ) Ownable(initialOwner) {
        if (_feeCollector == address(0)) revert InvalidAddress();
        if (_platformFee > 1000) revert FeeTooHigh(); // Max 10%
        
        feeCollector = _feeCollector;
        platformFee = _platformFee;
        minHardCap = 0.1 ether;
        maxDuration = 30 days;
    }

    // ============ External Functions ============

    /**
     * @notice Create a new IDO pool
     * @param name Pool name (for reference)
     * @param saleToken Token being sold
     * @param tokenPrice Price per token in wei
     * @param hardCap Maximum raise amount
     * @param softCap Minimum raise amount
     * @param minInvestment Minimum investment
     * @param maxInvestment Maximum investment
     * @param startTime Sale start timestamp
     * @param endTime Sale end timestamp
     * @param tgePercent TGE unlock percentage
     * @param cliffDuration Cliff duration in seconds
     * @param vestingDuration Vesting duration in seconds
     * @return poolAddress Address of created pool
     */
    function createPool(
        string calldata name,
        address saleToken,
        uint256 tokenPrice,
        uint256 hardCap,
        uint256 softCap,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint256 startTime,
        uint256 endTime,
        uint256 tgePercent,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external nonReentrant returns (address poolAddress) {
        // Validations
        if (saleToken == address(0)) revert InvalidAddress();
        if (hardCap < minHardCap) revert HardCapTooLow();
        if (endTime - startTime > maxDuration) revert DurationTooLong();
        if (startTime < block.timestamp) revert InvalidTime();

        // Deploy new pool
        IDOPool pool = new IDOPool(
            saleToken,
            tokenPrice,
            hardCap,
            softCap,
            minInvestment,
            maxInvestment,
            startTime,
            endTime,
            tgePercent,
            cliffDuration,
            vestingDuration,
            msg.sender  // Pool owner is the creator
        );

        poolAddress = address(pool);

        // Store pool details
        poolDetails[poolAddress] = PoolDetails({
            poolAddress: poolAddress,
            saleToken: saleToken,
            name: name,
            hardCap: hardCap,
            startTime: startTime,
            endTime: endTime,
            creator: msg.sender,
            createdAt: block.timestamp,
            isActive: true
        });

        allPools.push(poolAddress);
        creatorPools[msg.sender].push(poolAddress);

        // Set default whitelist if available
        if (address(defaultWhitelist) != address(0)) {
            pool.setWhitelist(address(defaultWhitelist), true);
        }

        emit PoolCreated(
            poolAddress,
            saleToken,
            msg.sender,
            name,
            hardCap,
            startTime,
            endTime
        );

        return poolAddress;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set default whitelist for new pools
     * @param _whitelist Whitelist contract address
     */
    function setDefaultWhitelist(address _whitelist) external onlyOwner {
        defaultWhitelist = Whitelist(_whitelist);
        emit DefaultWhitelistUpdated(_whitelist);
    }

    /**
     * @notice Update platform fee
     * @param _platformFee New fee in basis points
     */
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        if (_platformFee > 1000) revert FeeTooHigh();
        platformFee = _platformFee;
        emit PlatformFeeUpdated(_platformFee);
    }

    /**
     * @notice Update fee collector address
     * @param _feeCollector New fee collector address
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        if (_feeCollector == address(0)) revert InvalidAddress();
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }

    /**
     * @notice Update minimum hard cap
     * @param _minHardCap New minimum hard cap
     */
    function setMinHardCap(uint256 _minHardCap) external onlyOwner {
        minHardCap = _minHardCap;
    }

    /**
     * @notice Update maximum duration
     * @param _maxDuration New maximum duration in seconds
     */
    function setMaxDuration(uint256 _maxDuration) external onlyOwner {
        maxDuration = _maxDuration;
    }

    /**
     * @notice Update pool active status
     * @param poolAddress Pool address
     * @param isActive New status
     */
    function setPoolStatus(address poolAddress, bool isActive) external onlyOwner {
        if (poolDetails[poolAddress].poolAddress == address(0)) revert PoolNotFound();
        poolDetails[poolAddress].isActive = isActive;
        emit PoolStatusUpdated(poolAddress, isActive);
    }

    // ============ View Functions ============

    /**
     * @notice Get total number of pools
     * @return Total pools count
     */
    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }

    /**
     * @notice Get all pool addresses
     * @return Array of pool addresses
     */
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    /**
     * @notice Get pools created by an address
     * @param creator Creator address
     * @return Array of pool addresses
     */
    function getPoolsByCreator(address creator) external view returns (address[] memory) {
        return creatorPools[creator];
    }

    /**
     * @notice Get pool details
     * @param poolAddress Pool address
     * @return PoolDetails struct
     */
    function getPoolDetails(address poolAddress) external view returns (PoolDetails memory) {
        return poolDetails[poolAddress];
    }

    /**
     * @notice Get active pools
     * @return Array of active pool addresses
     */
    function getActivePools() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active pools
        for (uint256 i = 0; i < allPools.length; i++) {
            if (poolDetails[allPools[i]].isActive) {
                activeCount++;
            }
        }

        // Create result array
        address[] memory activePools = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPools.length; i++) {
            if (poolDetails[allPools[i]].isActive) {
                activePools[index] = allPools[i];
                index++;
            }
        }

        return activePools;
    }

    /**
     * @notice Get pools within a time range
     * @param fromTime Start time
     * @param toTime End time
     * @return Array of pool addresses
     */
    function getPoolsByTimeRange(
        uint256 fromTime,
        uint256 toTime
    ) external view returns (address[] memory) {
        uint256 count = 0;
        
        // Count matching pools
        for (uint256 i = 0; i < allPools.length; i++) {
            PoolDetails memory details = poolDetails[allPools[i]];
            if (details.startTime >= fromTime && details.endTime <= toTime) {
                count++;
            }
        }

        // Create result array
        address[] memory matchingPools = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allPools.length; i++) {
            PoolDetails memory details = poolDetails[allPools[i]];
            if (details.startTime >= fromTime && details.endTime <= toTime) {
                matchingPools[index] = allPools[i];
                index++;
            }
        }

        return matchingPools;
    }

    /**
     * @notice Check if address is a valid pool
     * @param poolAddress Address to check
     * @return True if valid pool
     */
    function isPool(address poolAddress) external view returns (bool) {
        return poolDetails[poolAddress].poolAddress != address(0);
    }
}
