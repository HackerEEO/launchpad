// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./Whitelist.sol";

/**
 * @title IDOPool
 * @author CryptoLaunch Team
 * @notice Individual IDO sale pool contract
 * @dev Handles token sales with whitelist, vesting, and refund functionality
 */
contract IDOPool is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum PoolStatus { Pending, Active, Finalized, Cancelled }

    // ============ Structs ============

    struct PoolInfo {
        IERC20 saleToken;           // Token being sold
        uint256 tokenPrice;          // Price per token in wei (ETH)
        uint256 hardCap;             // Maximum raise amount
        uint256 softCap;             // Minimum raise amount
        uint256 minInvestment;       // Minimum investment per wallet
        uint256 maxInvestment;       // Maximum investment per wallet
        uint256 startTime;           // Sale start timestamp
        uint256 endTime;             // Sale end timestamp
        uint256 tgePercent;          // Percentage unlocked at TGE (0-100)
        uint256 cliffDuration;       // Cliff period in seconds
        uint256 vestingDuration;     // Vesting period in seconds
    }

    struct InvestorInfo {
        uint256 invested;            // Total ETH invested
        uint256 tokensPurchased;     // Total tokens purchased
        uint256 tokensClaimed;       // Tokens already claimed
        bool refunded;               // Whether investor was refunded
    }

    // ============ State Variables ============

    /// @notice Pool configuration
    PoolInfo public poolInfo;

    /// @notice Current pool status
    PoolStatus public status;

    /// @notice Total amount raised in ETH
    uint256 public totalRaised;

    /// @notice Total tokens sold
    uint256 public totalTokensSold;

    /// @notice TGE timestamp (when claiming starts)
    uint256 public tgeTimestamp;

    /// @notice Whitelist contract (optional)
    Whitelist public whitelist;

    /// @notice Whether whitelist is required
    bool public whitelistEnabled;

    /// @notice Investor data mapping
    mapping(address => InvestorInfo) public investors;

    /// @notice Array of all investors
    address[] public investorList;

    // ============ Events ============

    event Investment(
        address indexed investor,
        uint256 amount,
        uint256 tokens,
        uint256 timestamp
    );

    event TokensClaimed(
        address indexed investor,
        uint256 amount,
        uint256 timestamp
    );

    event Refunded(
        address indexed investor,
        uint256 amount,
        uint256 timestamp
    );

    event SaleFinalized(
        uint256 totalRaised,
        uint256 totalTokensSold,
        bool softCapMet,
        uint256 timestamp
    );

    event SaleCancelled(uint256 timestamp);

    event TGESet(uint256 tgeTimestamp);

    event FundsWithdrawn(address indexed to, uint256 amount);

    event ExcessTokensWithdrawn(address indexed to, uint256 amount);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidAmount();
    error InvalidTime();
    error InvalidCaps();
    error SaleNotActive();
    error SaleNotEnded();
    error SaleAlreadyFinalized();
    error BelowMinInvestment();
    error AboveMaxInvestment();
    error HardCapReached();
    error NotWhitelisted();
    error AllocationExceeded();
    error TGENotSet();
    error TGENotStarted();
    error NoTokensToClaim();
    error AlreadyRefunded();
    error SoftCapMet();
    error SoftCapNotMet();
    error RefundsNotEnabled();
    error TransferFailed();
    error InsufficientTokens();

    // ============ Modifiers ============

    modifier onlyDuringSale() {
        if (status != PoolStatus.Active) revert SaleNotActive();
        if (block.timestamp < poolInfo.startTime) revert SaleNotActive();
        if (block.timestamp > poolInfo.endTime) revert SaleNotActive();
        _;
    }

    modifier onlyAfterSale() {
        if (block.timestamp <= poolInfo.endTime) revert SaleNotEnded();
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Initialize the IDO pool
     * @param _saleToken Token being sold
     * @param _tokenPrice Price per token in wei
     * @param _hardCap Maximum raise in wei
     * @param _softCap Minimum raise in wei
     * @param _minInvestment Minimum investment per wallet
     * @param _maxInvestment Maximum investment per wallet
     * @param _startTime Sale start timestamp
     * @param _endTime Sale end timestamp
     * @param _tgePercent TGE unlock percentage
     * @param _cliffDuration Cliff in seconds
     * @param _vestingDuration Vesting in seconds
     * @param _owner Pool owner address
     */
    constructor(
        address _saleToken,
        uint256 _tokenPrice,
        uint256 _hardCap,
        uint256 _softCap,
        uint256 _minInvestment,
        uint256 _maxInvestment,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _tgePercent,
        uint256 _cliffDuration,
        uint256 _vestingDuration,
        address _owner
    ) Ownable(_owner) {
        if (_saleToken == address(0)) revert InvalidAddress();
        if (_tokenPrice == 0) revert InvalidAmount();
        if (_hardCap == 0 || _softCap == 0 || _softCap > _hardCap) revert InvalidCaps();
        if (_startTime >= _endTime) revert InvalidTime();
        if (_tgePercent > 100) revert InvalidAmount();

        poolInfo = PoolInfo({
            saleToken: IERC20(_saleToken),
            tokenPrice: _tokenPrice,
            hardCap: _hardCap,
            softCap: _softCap,
            minInvestment: _minInvestment,
            maxInvestment: _maxInvestment,
            startTime: _startTime,
            endTime: _endTime,
            tgePercent: _tgePercent,
            cliffDuration: _cliffDuration,
            vestingDuration: _vestingDuration
        });

        status = PoolStatus.Pending;
    }

    // ============ External Functions ============

    /**
     * @notice Invest ETH in the IDO
     * @dev Validates whitelist, allocation, and caps
     */
    function invest() external payable nonReentrant whenNotPaused onlyDuringSale {
        uint256 amount = msg.value;
        address investor = msg.sender;

        // Validate investment amount
        if (amount < poolInfo.minInvestment) revert BelowMinInvestment();
        
        // Check hard cap
        if (totalRaised + amount > poolInfo.hardCap) revert HardCapReached();

        // Check whitelist if enabled
        if (whitelistEnabled) {
            if (!whitelist.isWhitelisted(investor)) revert NotWhitelisted();
            uint256 maxAllocation = whitelist.getAllocation(investor);
            if (investors[investor].invested + amount > maxAllocation) {
                revert AllocationExceeded();
            }
        }

        // Check max investment
        if (investors[investor].invested + amount > poolInfo.maxInvestment) {
            revert AboveMaxInvestment();
        }

        // Calculate tokens
        uint256 tokens = (amount * 1e18) / poolInfo.tokenPrice;

        // Update investor info
        if (investors[investor].invested == 0) {
            investorList.push(investor);
        }
        investors[investor].invested += amount;
        investors[investor].tokensPurchased += tokens;

        // Update totals
        totalRaised += amount;
        totalTokensSold += tokens;

        emit Investment(investor, amount, tokens, block.timestamp);
    }

    /**
     * @notice Claim vested tokens
     */
    function claim() external nonReentrant {
        if (status != PoolStatus.Finalized) revert SaleNotEnded();
        if (tgeTimestamp == 0) revert TGENotSet();
        if (block.timestamp < tgeTimestamp) revert TGENotStarted();

        InvestorInfo storage info = investors[msg.sender];
        if (info.tokensPurchased == 0) revert NoTokensToClaim();
        if (info.refunded) revert AlreadyRefunded();

        uint256 claimable = getClaimableAmount(msg.sender);
        if (claimable == 0) revert NoTokensToClaim();

        info.tokensClaimed += claimable;
        poolInfo.saleToken.safeTransfer(msg.sender, claimable);

        emit TokensClaimed(msg.sender, claimable, block.timestamp);
    }

    /**
     * @notice Request refund if soft cap not met
     */
    function refund() external nonReentrant onlyAfterSale {
        if (totalRaised >= poolInfo.softCap) revert SoftCapMet();
        
        InvestorInfo storage info = investors[msg.sender];
        if (info.invested == 0) revert InvalidAmount();
        if (info.refunded) revert AlreadyRefunded();

        uint256 refundAmount = info.invested;
        info.refunded = true;

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        if (!success) revert TransferFailed();

        emit Refunded(msg.sender, refundAmount, block.timestamp);
    }

    // ============ Admin Functions ============

    /**
     * @notice Activate the sale
     */
    function activateSale() external onlyOwner {
        if (status != PoolStatus.Pending) revert SaleAlreadyFinalized();
        
        // Verify sufficient tokens are deposited
        uint256 requiredTokens = (poolInfo.hardCap * 1e18) / poolInfo.tokenPrice;
        if (poolInfo.saleToken.balanceOf(address(this)) < requiredTokens) {
            revert InsufficientTokens();
        }
        
        status = PoolStatus.Active;
    }

    /**
     * @notice Finalize the sale after end time
     */
    function finalize() external onlyOwner onlyAfterSale {
        if (status == PoolStatus.Finalized) revert SaleAlreadyFinalized();
        if (status == PoolStatus.Cancelled) revert SaleAlreadyFinalized();

        bool softCapMet = totalRaised >= poolInfo.softCap;
        status = PoolStatus.Finalized;

        emit SaleFinalized(totalRaised, totalTokensSold, softCapMet, block.timestamp);
    }

    /**
     * @notice Set TGE timestamp (when claiming starts)
     * @param _tgeTimestamp TGE timestamp
     */
    function setTGE(uint256 _tgeTimestamp) external onlyOwner {
        if (_tgeTimestamp < block.timestamp) revert InvalidTime();
        tgeTimestamp = _tgeTimestamp;
        emit TGESet(_tgeTimestamp);
    }

    /**
     * @notice Cancel the sale
     */
    function cancelSale() external onlyOwner {
        if (status == PoolStatus.Finalized) revert SaleAlreadyFinalized();
        status = PoolStatus.Cancelled;
        emit SaleCancelled(block.timestamp);
    }

    /**
     * @notice Set whitelist contract
     * @param _whitelist Whitelist contract address
     * @param _enabled Whether to enable whitelist
     */
    function setWhitelist(address _whitelist, bool _enabled) external onlyOwner {
        if (_whitelist == address(0) && _enabled) revert InvalidAddress();
        whitelist = Whitelist(_whitelist);
        whitelistEnabled = _enabled;
    }

    /**
     * @notice Withdraw raised funds (after finalization, if soft cap met)
     * @param to Destination address
     */
    function withdrawFunds(address to) external onlyOwner {
        if (status != PoolStatus.Finalized) revert SaleNotEnded();
        if (totalRaised < poolInfo.softCap) revert SoftCapNotMet();
        if (to == address(0)) revert InvalidAddress();

        uint256 balance = address(this).balance;
        (bool success, ) = payable(to).call{value: balance}("");
        if (!success) revert TransferFailed();

        emit FundsWithdrawn(to, balance);
    }

    /**
     * @notice Withdraw unsold tokens
     * @param to Destination address
     */
    function withdrawExcessTokens(address to) external onlyOwner onlyAfterSale {
        if (to == address(0)) revert InvalidAddress();

        uint256 balance = poolInfo.saleToken.balanceOf(address(this));
        uint256 committed = totalTokensSold - getTotalClaimed();
        uint256 excess = balance > committed ? balance - committed : 0;

        if (excess > 0) {
            poolInfo.saleToken.safeTransfer(to, excess);
            emit ExcessTokensWithdrawn(to, excess);
        }
    }

    /**
     * @notice Emergency withdraw all tokens (only if cancelled)
     * @param to Destination address
     */
    function emergencyWithdraw(address to) external onlyOwner {
        if (status != PoolStatus.Cancelled) revert SaleNotEnded();
        if (to == address(0)) revert InvalidAddress();

        uint256 tokenBalance = poolInfo.saleToken.balanceOf(address(this));
        if (tokenBalance > 0) {
            poolInfo.saleToken.safeTransfer(to, tokenBalance);
        }

        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool success, ) = payable(to).call{value: ethBalance}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /**
     * @notice Get claimable token amount for an investor
     * @param investor Investor address
     * @return Claimable amount
     */
    function getClaimableAmount(address investor) public view returns (uint256) {
        InvestorInfo memory info = investors[investor];
        
        if (info.tokensPurchased == 0 || info.refunded) return 0;
        if (tgeTimestamp == 0 || block.timestamp < tgeTimestamp) return 0;

        uint256 vested = getVestedAmount(investor);
        return vested > info.tokensClaimed ? vested - info.tokensClaimed : 0;
    }

    /**
     * @notice Get total vested amount for an investor
     * @param investor Investor address
     * @return Vested amount
     */
    function getVestedAmount(address investor) public view returns (uint256) {
        InvestorInfo memory info = investors[investor];
        
        if (info.tokensPurchased == 0) return 0;
        if (tgeTimestamp == 0 || block.timestamp < tgeTimestamp) return 0;

        // TGE amount
        uint256 tgeAmount = (info.tokensPurchased * poolInfo.tgePercent) / 100;
        uint256 vestingAmount = info.tokensPurchased - tgeAmount;

        if (vestingAmount == 0) return tgeAmount;

        // Check cliff
        uint256 cliffEnd = tgeTimestamp + poolInfo.cliffDuration;
        if (block.timestamp < cliffEnd) return tgeAmount;

        // Linear vesting
        uint256 vestingEnd = cliffEnd + poolInfo.vestingDuration;
        
        if (block.timestamp >= vestingEnd) {
            return info.tokensPurchased;
        }

        uint256 elapsed = block.timestamp - cliffEnd;
        uint256 vestedFromSchedule = (vestingAmount * elapsed) / poolInfo.vestingDuration;
        
        return tgeAmount + vestedFromSchedule;
    }

    /**
     * @notice Get investor info
     * @param investor Investor address
     * @return InvestorInfo struct
     */
    function getInvestorInfo(address investor) external view returns (InvestorInfo memory) {
        return investors[investor];
    }

    /**
     * @notice Get pool info
     * @return PoolInfo struct
     */
    function getPoolInfo() external view returns (PoolInfo memory) {
        return poolInfo;
    }

    /**
     * @notice Get total investors count
     * @return Number of investors
     */
    function getInvestorCount() external view returns (uint256) {
        return investorList.length;
    }

    /**
     * @notice Get total claimed tokens
     * @return Total claimed
     */
    function getTotalClaimed() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < investorList.length; i++) {
            total += investors[investorList[i]].tokensClaimed;
        }
        return total;
    }

    /**
     * @notice Check if soft cap is met
     * @return True if soft cap is met
     */
    function isSoftCapMet() external view returns (bool) {
        return totalRaised >= poolInfo.softCap;
    }

    /**
     * @notice Get remaining allocation for investor
     * @param investor Investor address
     * @return Remaining allocation in wei
     */
    function getRemainingAllocation(address investor) external view returns (uint256) {
        uint256 maxAlloc = poolInfo.maxInvestment;
        
        if (whitelistEnabled) {
            uint256 whitelistAlloc = whitelist.getAllocation(investor);
            if (whitelistAlloc < maxAlloc) {
                maxAlloc = whitelistAlloc;
            }
        }
        
        uint256 invested = investors[investor].invested;
        return invested >= maxAlloc ? 0 : maxAlloc - invested;
    }

    // ============ Receive ============

    receive() external payable {
        revert("Use invest() function");
    }
}
