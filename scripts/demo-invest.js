/**
 * Demo Investment Script
 * 
 * This script demonstrates how to interact with the CryptoLaunch IDO Pool
 * contracts on Sepolia testnet.
 * 
 * Prerequisites:
 * 1. Deploy contracts using: cd contracts && npm run deploy:sepolia
 * 2. Set environment variables in .env file
 * 3. Have some Sepolia ETH in your wallet for gas
 * 
 * Usage:
 * node scripts/demo-invest.js
 * 
 * Environment Variables Required:
 * - PRIVATE_KEY: Your wallet private key (for signing transactions)
 * - SEPOLIA_RPC_URL: Sepolia RPC endpoint
 * - IDO_POOL_ADDRESS: Deployed IDO Pool contract address
 */

import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load ABI
const IDO_POOL_ABI = JSON.parse(
  readFileSync(join(__dirname, '../src/contracts/abis/IDOPool.json'), 'utf-8')
);

// Configuration
const config = {
  rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  privateKey: process.env.PRIVATE_KEY,
  idoPoolAddress: process.env.IDO_POOL_ADDRESS,
  investAmount: process.env.INVEST_AMOUNT || '0.1', // ETH
};

// Validate configuration
function validateConfig() {
  if (!config.privateKey) {
    console.error('❌ PRIVATE_KEY environment variable is required');
    process.exit(1);
  }
  if (!config.idoPoolAddress) {
    console.error('❌ IDO_POOL_ADDRESS environment variable is required');
    process.exit(1);
  }
}

// Format address for display
function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format ETH amount
function formatEth(weiAmount) {
  return ethers.formatEther(weiAmount);
}

// Main demo function
async function main() {
  console.log('🚀 CryptoLaunch Demo Investment Script');
  console.log('=====================================\n');

  validateConfig();

  // Connect to provider
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  const wallet = new ethers.Wallet(config.privateKey, provider);
  
  console.log(`📍 Connected to Sepolia`);
  console.log(`👛 Wallet: ${formatAddress(wallet.address)}`);
  
  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${formatEth(balance)} ETH\n`);

  // Connect to IDO Pool contract
  const idoPool = new ethers.Contract(config.idoPoolAddress, IDO_POOL_ABI, wallet);
  console.log(`📄 IDO Pool: ${formatAddress(config.idoPoolAddress)}\n`);

  // Get pool info
  console.log('📊 Fetching pool info...');
  const poolInfo = await idoPool.poolInfo();
  
  console.log('Pool Information:');
  console.log(`  Token Price: ${formatEth(poolInfo.tokenPrice)} ETH`);
  console.log(`  Hard Cap: ${formatEth(poolInfo.hardCap)} ETH`);
  console.log(`  Soft Cap: ${formatEth(poolInfo.softCap)} ETH`);
  console.log(`  Total Raised: ${formatEth(poolInfo.totalRaised)} ETH`);
  console.log(`  Min Contribution: ${formatEth(poolInfo.minContribution)} ETH`);
  console.log(`  Max Contribution: ${formatEth(poolInfo.maxContribution)} ETH`);
  console.log(`  Finalized: ${poolInfo.finalized}`);
  console.log(`  Cancelled: ${poolInfo.cancelled}\n`);

  // Check if pool is active
  const now = Math.floor(Date.now() / 1000);
  const startTime = Number(poolInfo.startTime);
  const endTime = Number(poolInfo.endTime);

  if (now < startTime) {
    console.log(`⏳ Pool not started yet. Starts in ${Math.floor((startTime - now) / 60)} minutes`);
    return;
  }

  if (now > endTime) {
    console.log('⏰ Pool has ended');
    return;
  }

  if (poolInfo.finalized) {
    console.log('✅ Pool is already finalized');
    return;
  }

  if (poolInfo.cancelled) {
    console.log('❌ Pool has been cancelled');
    return;
  }

  // Get investor info
  console.log('👤 Checking your investment status...');
  const investorInfo = await idoPool.getInvestorInfo(wallet.address);
  console.log(`  Current Contribution: ${formatEth(investorInfo.contribution)} ETH`);
  console.log(`  Token Allocation: ${formatEth(investorInfo.tokenAllocation)} tokens`);
  console.log(`  Claimed: ${investorInfo.claimed}`);
  console.log(`  Refunded: ${investorInfo.refunded}\n`);

  // Prepare investment
  const investAmount = ethers.parseEther(config.investAmount);
  
  // Validate investment amount
  if (investAmount < poolInfo.minContribution) {
    console.log(`❌ Investment amount below minimum (${formatEth(poolInfo.minContribution)} ETH)`);
    return;
  }

  const totalAfterInvestment = investorInfo.contribution + investAmount;
  if (totalAfterInvestment > poolInfo.maxContribution) {
    console.log(`❌ Total contribution would exceed maximum (${formatEth(poolInfo.maxContribution)} ETH)`);
    return;
  }

  if (investAmount > balance) {
    console.log('❌ Insufficient ETH balance');
    return;
  }

  // Invest
  console.log(`💸 Investing ${config.investAmount} ETH...`);
  
  try {
    // Estimate gas
    const gasEstimate = await idoPool.invest.estimateGas({ value: investAmount });
    console.log(`⛽ Estimated gas: ${gasEstimate.toString()}`);

    // Get gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;
    const gasCost = gasEstimate * gasPrice;
    console.log(`💵 Estimated gas cost: ${formatEth(gasCost)} ETH`);

    // Send transaction
    console.log('\n📤 Sending transaction...');
    const tx = await idoPool.invest({ value: investAmount });
    console.log(`🔗 Transaction hash: ${tx.hash}`);
    console.log(`   View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);

    // Wait for confirmation
    console.log('\n⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Investment successful!\n');
      
      // Parse Investment event
      const investmentEvent = receipt.logs
        .map(log => {
          try {
            return idoPool.interface.parseLog({ topics: log.topics, data: log.data });
          } catch {
            return null;
          }
        })
        .find(parsed => parsed && parsed.name === 'Investment');

      if (investmentEvent) {
        console.log('📝 Investment Details:');
        console.log(`   Investor: ${investmentEvent.args.investor}`);
        console.log(`   Payment Amount: ${formatEth(investmentEvent.args.paymentAmount)} ETH`);
        console.log(`   Token Amount: ${formatEth(investmentEvent.args.tokenAmount)} tokens`);
      }

      // Get updated investor info
      console.log('\n📊 Updated Investment Status:');
      const updatedInfo = await idoPool.getInvestorInfo(wallet.address);
      console.log(`   Total Contribution: ${formatEth(updatedInfo.contribution)} ETH`);
      console.log(`   Total Token Allocation: ${formatEth(updatedInfo.tokenAllocation)} tokens`);

    } else {
      console.log('❌ Transaction failed');
    }

  } catch (error) {
    console.error('❌ Investment failed:', error.message);
    
    if (error.reason) {
      console.error('   Reason:', error.reason);
    }
  }
}

// Run
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
