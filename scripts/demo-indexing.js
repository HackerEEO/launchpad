#!/usr/bin/env node
/**
 * Demo Indexing Script
 * 
 * This script demonstrates the full indexing pipeline:
 * 1. Submit an investment transaction to Sepolia testnet
 * 2. Wait for confirmations
 * 3. Query the subgraph for the indexed event
 * 4. Call the Supabase edge function to verify and persist
 * 
 * Prerequisites:
 * - Node.js 18+
 * - Environment variables configured (see .env.example)
 * - Funded wallet on Sepolia
 * - Deployed IDOPool contract (or use mock)
 * 
 * Usage:
 *   node scripts/demo-indexing.js
 *   node scripts/demo-indexing.js --dry-run  # Skip actual transaction
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const config = {
  rpcUrl: process.env.VITE_RPC_URL || 'https://rpc.sepolia.org',
  chainId: parseInt(process.env.VITE_CHAIN_ID || '11155111'),
  privateKey: process.env.DEMO_PRIVATE_KEY || '',
  poolAddress: process.env.DEMO_POOL_ADDRESS || '',
  subgraphUrl: process.env.SUBGRAPH_URL || '',
  supabaseUrl: process.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: process.env.VITE_SUPABASE_SUPABASE_ANON_KEY || '',
  edgeFunctionUrl: '', // Will be constructed
  requiredConfirmations: parseInt(process.env.INDEXER_CONFIRMATIONS || '1'),
  investmentAmount: '0.001', // ETH
};

// IDOPool ABI (minimal for invest)
const IDO_POOL_ABI = [
  'function invest() payable',
  'event Investment(address indexed investor, uint256 amount, uint256 tokens, uint256 timestamp)',
];

// Console styling
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warn: (msg) => console.log(`⚠️  ${msg}`),
  step: (num, msg) => console.log(`\n📍 Step ${num}: ${msg}`),
};

/**
 * Query subgraph for investment by transaction hash
 */
async function querySubgraph(txHash) {
  if (!config.subgraphUrl) {
    log.warn('No SUBGRAPH_URL configured, skipping subgraph query');
    return null;
  }

  const query = `{
    investments(where: { transactionHash: "${txHash.toLowerCase()}" }) {
      id
      investor
      paymentAmount
      tokenAmount
      pool
      blockNumber
      timestamp
      transactionHash
    }
  }`;

  try {
    const response = await fetch(config.subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    return data?.data?.investments?.[0] || null;
  } catch (error) {
    log.error(`Subgraph query failed: ${error.message}`);
    return null;
  }
}

/**
 * Call Supabase edge function to process investment
 */
async function callEdgeFunction(txHash, projectId, userWallet, amount) {
  if (!config.supabaseUrl) {
    log.warn('No SUPABASE_URL configured, skipping edge function call');
    return null;
  }

  const url = `${config.supabaseUrl}/functions/v1/process-investment`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
      },
      body: JSON.stringify({
        project_id: projectId,
        user_wallet: userWallet,
        amount_invested: amount,
        transaction_hash: txHash,
        chain_id: config.chainId,
      }),
    });

    return await response.json();
  } catch (error) {
    log.error(`Edge function call failed: ${error.message}`);
    return null;
  }
}

/**
 * Wait for transaction confirmations
 */
async function waitForConfirmations(provider, txHash, required) {
  log.info(`Waiting for ${required} confirmation(s)...`);
  
  let confirmations = 0;
  while (confirmations < required) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt) {
      const currentBlock = await provider.getBlockNumber();
      confirmations = currentBlock - receipt.blockNumber;
      log.info(`Confirmations: ${confirmations}/${required}`);
    }
    
    if (confirmations < required) {
      await new Promise(resolve => setTimeout(resolve, 12000)); // ~12s per block
    }
  }
  
  return confirmations;
}

/**
 * Main demo function
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log('\n🚀 CryptoLaunch Indexing Demo\n');
  console.log('═'.repeat(50));
  
  // Check configuration
  log.step(0, 'Checking configuration');
  
  if (!config.privateKey && !isDryRun) {
    log.error('DEMO_PRIVATE_KEY not set. Use --dry-run or set the environment variable.');
    process.exit(1);
  }
  
  if (!config.poolAddress && !isDryRun) {
    log.error('DEMO_POOL_ADDRESS not set. Use --dry-run or set the environment variable.');
    process.exit(1);
  }

  log.info(`Network: ${config.chainId === 11155111 ? 'Sepolia' : `Chain ${config.chainId}`}`);
  log.info(`RPC: ${config.rpcUrl}`);
  log.info(`Pool Address: ${config.poolAddress || '(not set)'}`);
  log.info(`Subgraph URL: ${config.subgraphUrl || '(not set)'}`);
  log.info(`Required Confirmations: ${config.requiredConfirmations}`);
  log.info(`Dry Run: ${isDryRun}`);

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(config.rpcUrl);
  
  let wallet;
  let txHash;
  
  if (isDryRun) {
    // Use a sample transaction hash for testing
    log.step(1, 'Simulating investment (dry run)');
    txHash = process.env.DEMO_TX_HASH || '0x0000000000000000000000000000000000000000000000000000000000000000';
    log.info(`Using sample tx hash: ${txHash}`);
    
    wallet = { address: '0x0000000000000000000000000000000000000001' };
  } else {
    wallet = new ethers.Wallet(config.privateKey, provider);
    
    log.step(1, 'Submitting investment transaction');
    log.info(`Wallet: ${wallet.address}`);
    
    const balance = await provider.getBalance(wallet.address);
    log.info(`Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther(config.investmentAmount)) {
      log.error(`Insufficient balance. Need at least ${config.investmentAmount} ETH`);
      process.exit(1);
    }
    
    // Submit investment transaction
    const pool = new ethers.Contract(config.poolAddress, IDO_POOL_ABI, wallet);
    
    try {
      const tx = await pool.invest({
        value: ethers.parseEther(config.investmentAmount),
      });
      
      log.success(`Transaction submitted: ${tx.hash}`);
      txHash = tx.hash;
      
      // Wait for confirmation
      log.info('Waiting for transaction confirmation...');
      const receipt = await tx.wait();
      log.success(`Transaction confirmed in block ${receipt.blockNumber}`);
    } catch (error) {
      log.error(`Transaction failed: ${error.message}`);
      process.exit(1);
    }
  }

  // Wait for required confirmations
  log.step(2, 'Waiting for block confirmations');
  
  if (!isDryRun && txHash !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    await waitForConfirmations(provider, txHash, config.requiredConfirmations);
    log.success('Required confirmations reached');
  } else {
    log.info('Skipping confirmation wait (dry run)');
  }

  // Query subgraph
  log.step(3, 'Querying subgraph for indexed event');
  
  const subgraphData = await querySubgraph(txHash);
  
  if (subgraphData) {
    log.success('Found investment in subgraph:');
    console.log(JSON.stringify(subgraphData, null, 2));
  } else {
    log.warn('Investment not found in subgraph (may not be deployed or indexed yet)');
  }

  // Call edge function
  log.step(4, 'Calling Supabase edge function');
  
  const edgeResult = await callEdgeFunction(
    txHash,
    'demo-project-id', // Replace with actual project ID
    wallet.address,
    config.investmentAmount
  );
  
  if (edgeResult) {
    if (edgeResult.success) {
      log.success('Edge function succeeded:');
      console.log(JSON.stringify(edgeResult, null, 2));
    } else {
      log.warn('Edge function returned error:');
      console.log(JSON.stringify(edgeResult, null, 2));
    }
  } else {
    log.warn('Edge function call skipped or failed');
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  log.step(5, 'Summary');
  console.log(`
📊 Demo Results:
   Transaction Hash: ${txHash}
   Subgraph Indexed: ${subgraphData ? '✅ Yes' : '❌ No'}
   Edge Function:    ${edgeResult?.success ? '✅ Verified' : '❌ Not verified'}
   
${isDryRun ? '⚠️  This was a dry run. No actual transaction was submitted.' : ''}
  `);
}

// Run
main().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
