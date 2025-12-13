import {
  Investment as InvestmentEvent,
  TokensClaimed as TokensClaimedEvent,
  Refunded as RefundedEvent,
} from "../../generated/templates/IDOPool/IDOPool";
import {
  Investment,
  TokenClaim,
  Refund,
  PoolStats,
  InvestorStats,
} from "../../generated/schema";
import { BigInt, Bytes } from "@graphprotocol/graph-ts";

/**
 * Handle Investment event from IDOPool contract
 * Creates Investment entity and updates aggregate stats
 */
export function handleInvestment(event: InvestmentEvent): void {
  // Create unique ID from txHash and logIndex
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  
  let investment = new Investment(id);
  investment.investor = event.params.investor;
  investment.pool = event.address;
  investment.paymentAmount = event.params.amount;
  investment.tokenAmount = event.params.tokens;
  investment.timestamp = event.params.timestamp;
  investment.blockNumber = event.block.number;
  investment.transactionHash = event.transaction.hash;
  investment.logIndex = event.logIndex;
  investment.save();

  // Update pool stats
  let poolStats = getOrCreatePoolStats(event.address);
  poolStats.totalRaised = poolStats.totalRaised.plus(event.params.amount);
  poolStats.totalTokensSold = poolStats.totalTokensSold.plus(event.params.tokens);
  poolStats.investmentCount = poolStats.investmentCount.plus(BigInt.fromI32(1));
  poolStats.lastUpdated = event.block.timestamp;
  poolStats.save();

  // Update investor stats
  let investorStats = getOrCreateInvestorStats(event.params.investor);
  investorStats.totalInvested = investorStats.totalInvested.plus(event.params.amount);
  investorStats.totalTokensPurchased = investorStats.totalTokensPurchased.plus(event.params.tokens);
  investorStats.lastActivity = event.block.timestamp;
  investorStats.save();
}

/**
 * Handle TokensClaimed event from IDOPool contract
 * Creates TokenClaim entity and updates aggregate stats
 */
export function handleTokensClaimed(event: TokensClaimedEvent): void {
  // Create unique ID from txHash and logIndex
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  
  let claim = new TokenClaim(id);
  claim.investor = event.params.investor;
  claim.pool = event.address;
  claim.amount = event.params.amount;
  claim.timestamp = event.params.timestamp;
  claim.blockNumber = event.block.number;
  claim.transactionHash = event.transaction.hash;
  claim.logIndex = event.logIndex;
  claim.save();

  // Update pool stats
  let poolStats = getOrCreatePoolStats(event.address);
  poolStats.totalTokensClaimed = poolStats.totalTokensClaimed.plus(event.params.amount);
  poolStats.claimCount = poolStats.claimCount.plus(BigInt.fromI32(1));
  poolStats.lastUpdated = event.block.timestamp;
  poolStats.save();

  // Update investor stats
  let investorStats = getOrCreateInvestorStats(event.params.investor);
  investorStats.totalTokensClaimed = investorStats.totalTokensClaimed.plus(event.params.amount);
  investorStats.lastActivity = event.block.timestamp;
  investorStats.save();
}

/**
 * Handle Refunded event from IDOPool contract
 * Creates Refund entity
 */
export function handleRefunded(event: RefundedEvent): void {
  // Create unique ID from txHash and logIndex
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  
  let refund = new Refund(id);
  refund.investor = event.params.investor;
  refund.pool = event.address;
  refund.amount = event.params.amount;
  refund.timestamp = event.params.timestamp;
  refund.blockNumber = event.block.number;
  refund.transactionHash = event.transaction.hash;
  refund.logIndex = event.logIndex;
  refund.save();
}

/**
 * Get or create PoolStats entity
 */
function getOrCreatePoolStats(poolAddress: Bytes): PoolStats {
  let id = poolAddress.toHexString();
  let stats = PoolStats.load(id);
  
  if (stats == null) {
    stats = new PoolStats(id);
    stats.totalRaised = BigInt.fromI32(0);
    stats.totalTokensSold = BigInt.fromI32(0);
    stats.totalTokensClaimed = BigInt.fromI32(0);
    stats.investorCount = BigInt.fromI32(0);
    stats.investmentCount = BigInt.fromI32(0);
    stats.claimCount = BigInt.fromI32(0);
    stats.lastUpdated = BigInt.fromI32(0);
  }
  
  return stats;
}

/**
 * Get or create InvestorStats entity
 */
function getOrCreateInvestorStats(investorAddress: Bytes): InvestorStats {
  let id = investorAddress.toHexString();
  let stats = InvestorStats.load(id);
  
  if (stats == null) {
    stats = new InvestorStats(id);
    stats.totalInvested = BigInt.fromI32(0);
    stats.totalTokensPurchased = BigInt.fromI32(0);
    stats.totalTokensClaimed = BigInt.fromI32(0);
    stats.poolCount = BigInt.fromI32(0);
    stats.lastActivity = BigInt.fromI32(0);
  }
  
  return stats;
}
