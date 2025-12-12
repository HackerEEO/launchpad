// Contract ABIs for frontend integration
// These are auto-generated after running `npx hardhat compile`
// Copy the generated ABIs from contracts/artifacts/src/*.sol/*.json

// For development, these are minimal ABIs with the essential functions
// In production, use the full ABIs from the artifacts folder

export const IDOPoolABI = [
  // Read functions
  "function saleToken() view returns (address)",
  "function tokenPrice() view returns (uint256)",
  "function hardCap() view returns (uint256)",
  "function softCap() view returns (uint256)",
  "function totalRaised() view returns (uint256)",
  "function startTime() view returns (uint256)",
  "function endTime() view returns (uint256)",
  "function minInvestment() view returns (uint256)",
  "function maxInvestment() view returns (uint256)",
  "function tgePercent() view returns (uint256)",
  "function cliffDuration() view returns (uint256)",
  "function vestingDuration() view returns (uint256)",
  "function isFinalized() view returns (bool)",
  "function investments(address) view returns (uint256)",
  "function claimed(address) view returns (uint256)",
  "function isSaleActive() view returns (bool)",
  "function getPoolInfo() view returns (address, uint256, uint256, uint256, uint256, uint256, uint256, bool)",
  "function getInvestorInfo(address investor) view returns (uint256 investment, uint256 tokenAllocation, uint256 claimedAmount, uint256 claimableAmount)",
  
  // Write functions
  "function invest() payable",
  "function claim()",
  "function refund()",
  
  // Events
  "event Investment(address indexed investor, uint256 amount)",
  "event TokensClaimed(address indexed investor, uint256 amount)",
  "event Refunded(address indexed investor, uint256 amount)",
  "event SaleFinalized(uint256 totalRaised, bool softCapReached)",
] as const;

export const TokenVestingABI = [
  // Read functions
  "function token() view returns (address)",
  "function getVestingScheduleCount() view returns (uint256)",
  "function getVestingScheduleCountByBeneficiary(address beneficiary) view returns (uint256)",
  "function getVestingSchedule(bytes32 scheduleId) view returns (tuple(address beneficiary, uint256 totalAmount, uint256 releasedAmount, uint256 tgePercent, uint256 startTime, uint256 cliffDuration, uint256 vestingDuration, bool revocable, bool revoked))",
  "function computeVestingScheduleId(address beneficiary, uint256 index) view returns (bytes32)",
  "function computeReleasableAmount(bytes32 scheduleId) view returns (uint256)",
  "function computeVestedAmount(bytes32 scheduleId) view returns (uint256)",
  
  // Write functions
  "function release(bytes32 scheduleId)",
  "function transferBeneficiary(bytes32 scheduleId, address newBeneficiary)",
  
  // Events
  "event VestingScheduleCreated(bytes32 indexed scheduleId, address indexed beneficiary, uint256 amount)",
  "event TokensReleased(address indexed beneficiary, uint256 amount)",
  "event VestingScheduleRevoked(bytes32 indexed scheduleId)",
  "event BeneficiaryTransferred(bytes32 indexed scheduleId, address indexed oldBeneficiary, address indexed newBeneficiary)",
] as const;

export const LaunchpadFactoryABI = [
  // Read functions
  "function getPoolCount() view returns (uint256)",
  "function getAllPools() view returns (address[])",
  "function getPoolsByCreator(address creator) view returns (address[])",
  "function getPoolDetails(address poolAddress) view returns (tuple(address poolAddress, address saleToken, string name, uint256 hardCap, uint256 startTime, uint256 endTime, address creator, uint256 createdAt, bool isActive))",
  "function getActivePools() view returns (address[])",
  "function isPool(address poolAddress) view returns (bool)",
  "function platformFee() view returns (uint256)",
  "function feeCollector() view returns (address)",
  "function minHardCap() view returns (uint256)",
  "function maxDuration() view returns (uint256)",
  
  // Write functions
  "function createPool(string name, address saleToken, uint256 tokenPrice, uint256 hardCap, uint256 softCap, uint256 minInvestment, uint256 maxInvestment, uint256 startTime, uint256 endTime, uint256 tgePercent, uint256 cliffDuration, uint256 vestingDuration) returns (address)",
  
  // Events
  "event PoolCreated(address indexed poolAddress, address indexed saleToken, address indexed creator, string name, uint256 hardCap, uint256 startTime, uint256 endTime)",
  "event PoolStatusUpdated(address indexed poolAddress, bool isActive)",
] as const;

export const WhitelistABI = [
  // Read functions
  "function isWhitelisted(address account) view returns (bool)",
  "function whitelistEnabled() view returns (bool)",
  "function getWhitelistCount() view returns (uint256)",
  
  // Write functions (admin only)
  "function addToWhitelist(address account)",
  "function removeFromWhitelist(address account)",
  "function addBatchToWhitelist(address[] accounts)",
  "function setWhitelistEnabled(bool enabled)",
  
  // Events
  "event AddedToWhitelist(address indexed account)",
  "event RemovedFromWhitelist(address indexed account)",
  "event WhitelistStatusChanged(bool enabled)",
] as const;

export const ERC20ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;
