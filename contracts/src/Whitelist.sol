// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Whitelist
 * @author CryptoLaunch Team
 * @notice Manages wallet whitelisting for IDO participation
 * @dev Simple whitelist with tier-based allocations
 */
contract Whitelist is Ownable, ReentrancyGuard {
    /// @notice Tier levels for allocation management
    enum Tier { None, Bronze, Silver, Gold, Platinum }

    /// @notice Whitelist entry for a wallet
    struct WhitelistEntry {
        bool isWhitelisted;
        Tier tier;
        uint256 maxAllocation;
        bool kycVerified;
    }

    /// @notice Mapping of wallet address to whitelist entry
    mapping(address => WhitelistEntry) public whitelist;

    /// @notice Default allocation per tier (in wei)
    mapping(Tier => uint256) public tierAllocations;

    /// @notice Total whitelisted addresses count
    uint256 public whitelistedCount;

    // ============ Events ============

    event AddressWhitelisted(address indexed account, Tier tier, uint256 maxAllocation);
    event AddressRemoved(address indexed account);
    event TierUpdated(address indexed account, Tier oldTier, Tier newTier);
    event KYCVerified(address indexed account);
    event TierAllocationUpdated(Tier tier, uint256 allocation);

    // ============ Errors ============

    error AlreadyWhitelisted();
    error NotWhitelisted();
    error InvalidAddress();
    error InvalidTier();

    // ============ Constructor ============

    /**
     * @notice Initialize whitelist with default tier allocations
     * @param initialOwner Address of the contract owner
     */
    constructor(address initialOwner) Ownable(initialOwner) {
        // Default allocations (can be updated by owner)
        tierAllocations[Tier.Bronze] = 0.1 ether;
        tierAllocations[Tier.Silver] = 0.5 ether;
        tierAllocations[Tier.Gold] = 1 ether;
        tierAllocations[Tier.Platinum] = 5 ether;
    }

    // ============ External Functions ============

    /**
     * @notice Add a single address to whitelist
     * @param account Address to whitelist
     * @param tier Tier level for the address
     */
    function addToWhitelist(address account, Tier tier) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        if (tier == Tier.None) revert InvalidTier();
        if (whitelist[account].isWhitelisted) revert AlreadyWhitelisted();

        whitelist[account] = WhitelistEntry({
            isWhitelisted: true,
            tier: tier,
            maxAllocation: tierAllocations[tier],
            kycVerified: false
        });

        whitelistedCount++;
        emit AddressWhitelisted(account, tier, tierAllocations[tier]);
    }

    /**
     * @notice Add multiple addresses to whitelist in batch
     * @param accounts Array of addresses to whitelist
     * @param tier Tier level for all addresses
     */
    function batchAddToWhitelist(address[] calldata accounts, Tier tier) external onlyOwner {
        if (tier == Tier.None) revert InvalidTier();
        
        uint256 length = accounts.length;
        for (uint256 i = 0; i < length;) {
            address account = accounts[i];
            if (account != address(0) && !whitelist[account].isWhitelisted) {
                whitelist[account] = WhitelistEntry({
                    isWhitelisted: true,
                    tier: tier,
                    maxAllocation: tierAllocations[tier],
                    kycVerified: false
                });
                whitelistedCount++;
                emit AddressWhitelisted(account, tier, tierAllocations[tier]);
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Remove address from whitelist
     * @param account Address to remove
     */
    function removeFromWhitelist(address account) external onlyOwner {
        if (!whitelist[account].isWhitelisted) revert NotWhitelisted();

        delete whitelist[account];
        whitelistedCount--;
        emit AddressRemoved(account);
    }

    /**
     * @notice Update tier for a whitelisted address
     * @param account Address to update
     * @param newTier New tier level
     */
    function updateTier(address account, Tier newTier) external onlyOwner {
        if (!whitelist[account].isWhitelisted) revert NotWhitelisted();
        if (newTier == Tier.None) revert InvalidTier();

        Tier oldTier = whitelist[account].tier;
        whitelist[account].tier = newTier;
        whitelist[account].maxAllocation = tierAllocations[newTier];

        emit TierUpdated(account, oldTier, newTier);
    }

    /**
     * @notice Mark address as KYC verified
     * @param account Address to verify
     */
    function verifyKYC(address account) external onlyOwner {
        if (!whitelist[account].isWhitelisted) revert NotWhitelisted();
        
        whitelist[account].kycVerified = true;
        emit KYCVerified(account);
    }

    /**
     * @notice Batch verify KYC for multiple addresses
     * @param accounts Array of addresses to verify
     */
    function batchVerifyKYC(address[] calldata accounts) external onlyOwner {
        uint256 length = accounts.length;
        for (uint256 i = 0; i < length;) {
            if (whitelist[accounts[i]].isWhitelisted) {
                whitelist[accounts[i]].kycVerified = true;
                emit KYCVerified(accounts[i]);
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Update default allocation for a tier
     * @param tier Tier to update
     * @param allocation New allocation amount in wei
     */
    function setTierAllocation(Tier tier, uint256 allocation) external onlyOwner {
        if (tier == Tier.None) revert InvalidTier();
        tierAllocations[tier] = allocation;
        emit TierAllocationUpdated(tier, allocation);
    }

    /**
     * @notice Set custom allocation for specific address
     * @param account Address to update
     * @param allocation Custom allocation amount
     */
    function setCustomAllocation(address account, uint256 allocation) external onlyOwner {
        if (!whitelist[account].isWhitelisted) revert NotWhitelisted();
        whitelist[account].maxAllocation = allocation;
    }

    // ============ View Functions ============

    /**
     * @notice Check if address is whitelisted
     * @param account Address to check
     * @return True if whitelisted
     */
    function isWhitelisted(address account) external view returns (bool) {
        return whitelist[account].isWhitelisted;
    }

    /**
     * @notice Check if address is KYC verified
     * @param account Address to check
     * @return True if KYC verified
     */
    function isKYCVerified(address account) external view returns (bool) {
        return whitelist[account].kycVerified;
    }

    /**
     * @notice Get max allocation for address
     * @param account Address to check
     * @return Max allocation in wei
     */
    function getAllocation(address account) external view returns (uint256) {
        return whitelist[account].maxAllocation;
    }

    /**
     * @notice Get tier for address
     * @param account Address to check
     * @return Tier level
     */
    function getTier(address account) external view returns (Tier) {
        return whitelist[account].tier;
    }

    /**
     * @notice Get full whitelist entry for address
     * @param account Address to check
     * @return WhitelistEntry struct
     */
    function getWhitelistEntry(address account) external view returns (WhitelistEntry memory) {
        return whitelist[account];
    }
}
