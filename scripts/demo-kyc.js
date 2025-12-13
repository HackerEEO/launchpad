#!/usr/bin/env node
/**
 * KYC Demo Script
 * 
 * End-to-end demonstration of the KYC verification flow:
 * 1. Create KYC session
 * 2. Simulate webhook callback (approval)
 * 3. Verify whitelist status
 * 4. Test investment with KYC verification
 * 
 * Usage:
 *   node scripts/demo-kyc.js
 * 
 * Environment:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, KYC_PROVIDER_SECRET
 */

import crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const KYC_PROVIDER_SECRET = process.env.KYC_PROVIDER_SECRET || 'test-secret-key';

const TEST_WALLET = '0x' + crypto.randomBytes(20).toString('hex');
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || null; // Optional

// ============================================================================
// Helper Functions
// ============================================================================

function generateWebhookSignature(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function callEdgeFunction(functionName, options = {}) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  const response = await fetch(url, {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  return { status: response.status, data };
}

function log(step, message, data = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Step ${step}] ${message}`);
  console.log('='.repeat(60));
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function success(message) {
  console.log(`\n✅ ${message}`);
}

function error(message) {
  console.log(`\n❌ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

// ============================================================================
// Demo Steps
// ============================================================================

async function step1_createSession() {
  log(1, 'Creating KYC Session', { wallet: TEST_WALLET });

  const result = await callEdgeFunction('kyc-create-session', {
    body: {
      walletAddress: TEST_WALLET,
      projectId: TEST_PROJECT_ID,
    },
  });

  if (result.status === 200 && result.data.success) {
    success('KYC session created successfully');
    info(`Session URL: ${result.data.sessionUrl}`);
    info(`Applicant ID: ${result.data.applicantId}`);
    return result.data;
  } else {
    error(`Failed to create session: ${result.data.error}`);
    return null;
  }
}

async function step2_checkInitialStatus() {
  log(2, 'Checking Initial KYC Status');

  const result = await callEdgeFunction('kyc-status', {
    method: 'GET',
    body: undefined,
  });

  // For GET, we need to use query params
  const url = `${SUPABASE_URL}/functions/v1/kyc-status?wallet=${TEST_WALLET}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  const data = await response.json();

  if (data.success) {
    success('Status check successful');
    info(`KYC Status: ${data.kycStatus}`);
    info(`KYC Verified: ${data.kycVerified}`);
    info(`Whitelisted: ${data.whitelisted}`);
    return data;
  } else {
    error(`Status check failed: ${data.error}`);
    return null;
  }
}

async function step3_simulateWebhook(applicantId) {
  log(3, 'Simulating Sumsub Webhook (Approval)');

  const webhookPayload = {
    applicantId: applicantId,
    inspectionId: 'insp-' + crypto.randomBytes(8).toString('hex'),
    correlationId: 'corr-' + crypto.randomBytes(8).toString('hex'),
    externalUserId: TEST_WALLET.toLowerCase(),
    levelName: 'basic-kyc-level',
    type: 'applicantReviewed',
    sandboxMode: true,
    reviewStatus: 'completed',
    reviewResult: {
      reviewAnswer: 'GREEN',
      rejectLabels: [],
    },
    createdAtMs: Date.now(),
    clientId: 'demo-client',
  };

  const payloadString = JSON.stringify(webhookPayload);
  const signature = generateWebhookSignature(payloadString, KYC_PROVIDER_SECRET);

  info(`Payload: ${payloadString.substring(0, 100)}...`);
  info(`Signature: ${signature}`);

  const url = `${SUPABASE_URL}/functions/v1/kyc-webhook`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-payload-digest': signature,
    },
    body: payloadString,
  });

  const data = await response.json();

  if (response.status === 200 && data.success) {
    success('Webhook processed successfully');
    return true;
  } else {
    error(`Webhook processing failed: ${data.error}`);
    return false;
  }
}

async function step4_checkFinalStatus() {
  log(4, 'Checking Final KYC Status');

  const url = `${SUPABASE_URL}/functions/v1/kyc-status?wallet=${TEST_WALLET}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  const data = await response.json();

  if (data.success) {
    success('Final status check successful');
    info(`KYC Status: ${data.kycStatus}`);
    info(`KYC Verified: ${data.kycVerified}`);
    info(`Whitelisted: ${data.whitelisted}`);
    info(`Whitelist Tier: ${data.whitelistTier || 'N/A'}`);
    
    if (data.kycVerified && data.whitelisted) {
      success('✨ KYC VERIFICATION COMPLETE - Wallet is now whitelisted!');
    }
    
    return data;
  } else {
    error(`Status check failed: ${data.error}`);
    return null;
  }
}

async function step5_testInvestment() {
  log(5, 'Testing Investment Flow (Optional)');

  if (!TEST_PROJECT_ID) {
    info('Skipping investment test - no TEST_PROJECT_ID provided');
    return null;
  }

  const result = await callEdgeFunction('process-investment', {
    body: {
      project_id: TEST_PROJECT_ID,
      user_wallet: TEST_WALLET,
      amount_invested: '1000000000000000000', // 1 ETH in wei
      transaction_hash: '0x' + crypto.randomBytes(32).toString('hex'),
    },
  });

  if (result.status === 200 && result.data.success) {
    success('Investment processed successfully');
    info(`Investment ID: ${result.data.investment?.id}`);
    return result.data;
  } else if (result.status === 403) {
    info(`Investment blocked (expected for KYC-required projects): ${result.data.error}`);
    info(`Code: ${result.data.code}`);
    return result.data;
  } else {
    error(`Investment failed: ${result.data.error}`);
    return null;
  }
}

async function step6_testAdminApproval() {
  log(6, 'Testing Manual Admin Approval');

  const testAdminWallet = '0x' + crypto.randomBytes(20).toString('hex');

  // Note: This requires admin auth which we simulate with service role
  const result = await callEdgeFunction('kyc-admin', {
    body: {
      action: 'approve',
      walletAddress: testAdminWallet,
      tier: 'gold',
      maxAllocation: '10000000000000000000', // 10 ETH
      notes: 'Manual approval via demo script',
    },
  });

  // This will likely fail without proper admin auth setup
  if (result.status === 200 && result.data.success) {
    success('Manual approval successful');
    info(`Approved wallet: ${testAdminWallet}`);
  } else if (result.status === 401) {
    info('Admin auth required (expected in demo mode)');
  } else {
    info(`Admin approval result: ${result.data.error || 'Unknown'}`);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           CryptoLaunch KYC Demo Script                     ║');
  console.log('║           Phase 6: KYC & Compliance                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Validate environment
  if (!SUPABASE_URL) {
    error('Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable');
    process.exit(1);
  }

  if (!SUPABASE_KEY) {
    error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    process.exit(1);
  }

  info(`Supabase URL: ${SUPABASE_URL}`);
  info(`Test Wallet: ${TEST_WALLET}`);
  info(`Project ID: ${TEST_PROJECT_ID || 'Not specified'}`);

  try {
    // Step 1: Create session
    const session = await step1_createSession();
    if (!session) {
      error('Demo aborted: Failed to create session');
      process.exit(1);
    }

    // Wait a moment for DB to sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Check initial status (should be pending)
    await step2_checkInitialStatus();

    // Step 3: Simulate webhook approval
    const webhookSuccess = await step3_simulateWebhook(session.applicantId);
    if (!webhookSuccess) {
      info('Webhook simulation failed - this is expected if signature verification is strict');
    }

    // Wait for DB update
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Check final status
    const finalStatus = await step4_checkFinalStatus();

    // Step 5: Test investment flow
    await step5_testInvestment();

    // Step 6: Test admin approval
    await step6_testAdminApproval();

    // Summary
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                     Demo Complete                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('\n');

    console.log('Summary:');
    console.log('────────────────────────────────────────');
    console.log(`Test Wallet: ${TEST_WALLET}`);
    console.log(`KYC Status: ${finalStatus?.kycStatus || 'unknown'}`);
    console.log(`Whitelisted: ${finalStatus?.whitelisted || false}`);
    console.log('────────────────────────────────────────');
    console.log('\n');

    console.log('Next Steps:');
    console.log('1. Configure real Sumsub credentials in .env');
    console.log('2. Set up webhook URL in Sumsub dashboard');
    console.log('3. Test with real KYC verification');
    console.log('4. Review admin UI at /admin/kyc-review');
    console.log('\n');

  } catch (err) {
    error(`Demo failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
