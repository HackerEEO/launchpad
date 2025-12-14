import { PoolCreated } from "../../generated/LaunchpadFactory/LaunchpadFactory";
import { IDOPool } from "../../generated/templates";
import { PoolStats } from "../../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";

/**
 * Handle PoolCreated event from LaunchpadFactory contract
 * Creates dynamic data source to track new IDO Pool events
 */
export function handlePoolCreated(event: PoolCreated): void {
  // Create dynamic data source for the new pool
  IDOPool.create(event.params.pool);

  // Initialize pool stats
  let stats = new PoolStats(event.params.pool.toHexString());
  stats.totalRaised = BigInt.fromI32(0);
  stats.totalTokensSold = BigInt.fromI32(0);
  stats.totalTokensClaimed = BigInt.fromI32(0);
  stats.investorCount = BigInt.fromI32(0);
  stats.investmentCount = BigInt.fromI32(0);
  stats.claimCount = BigInt.fromI32(0);
  stats.lastUpdated = event.block.timestamp;
  stats.save();
}
