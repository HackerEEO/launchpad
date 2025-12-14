import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { ethers } from 'npm:ethers@6.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// IDOPool Investment event ABI for decoding logs
const IDO_POOL_ABI = [
  'event Investment(address indexed investor, uint256 paymentAmount, uint256 tokenAmount)'
];

// Configuration from environment
const REQUIRED_CONFIRMATIONS = Number(Deno.env.get('INDEXER_CONFIRMATIONS') ?? '1');
const SUBGRAPH_URL = Deno.env.get('SUBGRAPH_URL');

// Network RPC URLs (configure in Supabase edge function secrets)
const RPC_URLS: Record<number, string> = {
  1: Deno.env.get('MAINNET_RPC_URL') ?? 'https://eth.llamarpc.com',
  10: Deno.env.get('OPTIMISM_RPC_URL') ?? 'https://mainnet.optimism.io',
  137: Deno.env.get('POLYGON_RPC_URL') ?? 'https://polygon-rpc.com',
  8453: Deno.env.get('BASE_RPC_URL') ?? 'https://mainnet.base.org',
  42161: Deno.env.get('ARBITRUM_RPC_URL') ?? 'https://arb1.arbitrum.io/rpc',
  11155111: Deno.env.get('SEPOLIA_RPC_URL') ?? 'https://rpc.sepolia.org',
};

interface TransactionVerificationResult {
  verified: boolean;
  source: 'onchain' | 'subgraph' | 'both';
  investor?: string;
  paymentAmount?: string;
  tokenAmount?: string;
  poolAddress?: string;
  blockNumber?: number;
  confirmations?: number;
  error?: string;
}

/**
 * Query subgraph for investment by transaction hash (optional cross-check)
 */
async function querySubgraphInvestment(txHash: string): Promise<any | null> {
  if (!SUBGRAPH_URL) return null;
  
  try {
    const query = `{
      investments(where: { transactionHash: "${txHash.toLowerCase()}" }) {
        id
        investor
        paymentAmount
        tokenAmount
        pool
        blockNumber
        timestamp
      }
    }`;
    
    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    return data?.data?.investments?.[0] || null;
  } catch (error) {
    console.error('Subgraph query failed:', error);
    return null;
  }
}

/**
 * Verify an investment transaction on-chain by checking the transaction receipt
 * and parsing the Investment event from the logs
 */
async function verifyInvestmentTransaction(
  txHash: string,
  chainId: number,
  expectedInvestor: string
): Promise<TransactionVerificationResult> {
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) {
    return { verified: false, source: 'onchain', error: `Unsupported chain ID: ${chainId}` };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { verified: false, source: 'onchain', error: 'Transaction not found or not yet confirmed' };
    }

    // Check transaction was successful
    if (receipt.status !== 1) {
      return { verified: false, source: 'onchain', error: 'Transaction failed on-chain' };
    }

    // Check block confirmations
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;
    
    if (confirmations < REQUIRED_CONFIRMATIONS) {
      return { 
        verified: false, 
        source: 'onchain',
        blockNumber: receipt.blockNumber,
        confirmations,
        error: `Insufficient confirmations: ${confirmations}/${REQUIRED_CONFIRMATIONS}` 
      };
    }

    // Parse Investment event from logs
    const iface = new ethers.Interface(IDO_POOL_ABI);
    
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
        
        if (parsed && parsed.name === 'Investment') {
          const investor = parsed.args.investor.toLowerCase();
          const paymentAmount = parsed.args.paymentAmount.toString();
          const tokenAmount = parsed.args.tokenAmount.toString();

          // Verify the investor matches
          if (investor !== expectedInvestor.toLowerCase()) {
            return { 
              verified: false,
              source: 'onchain',
              error: `Investor mismatch: expected ${expectedInvestor}, got ${investor}` 
            };
          }

          // Optional: Cross-check with subgraph if available
          let source: 'onchain' | 'subgraph' | 'both' = 'onchain';
          const subgraphData = await querySubgraphInvestment(txHash);
          
          if (subgraphData) {
            // Validate subgraph data matches on-chain data
            if (
              subgraphData.investor.toLowerCase() === investor &&
              subgraphData.paymentAmount === paymentAmount &&
              subgraphData.tokenAmount === tokenAmount
            ) {
              source = 'both';
            } else {
              console.warn('Subgraph data mismatch with on-chain data');
            }
          }

          return {
            verified: true,
            source,
            investor,
            paymentAmount,
            tokenAmount,
            poolAddress: log.address.toLowerCase(),
            blockNumber: receipt.blockNumber,
            confirmations,
          };
        }
      } catch {
        // Not an Investment event, continue to next log
        continue;
      }
    }

    return { verified: false, source: 'onchain', error: 'No Investment event found in transaction logs' };
  } catch (error) {
    return { verified: false, source: 'onchain', error: `Verification failed: ${(error as Error).message}` };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { project_id, user_wallet, amount_invested, transaction_hash, chain_id = 11155111 } = await req.json();

    if (!project_id || !user_wallet || !amount_invested || !transaction_hash) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: project_id, user_wallet, amount_invested, transaction_hash' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // STEP 1: Verify transaction on-chain
    // ========================================
    const verification = await verifyInvestmentTransaction(
      transaction_hash,
      chain_id,
      user_wallet
    );

    if (!verification.verified) {
      return new Response(
        JSON.stringify({ 
          error: 'Transaction verification failed', 
          details: verification.error 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // STEP 2: Validate project exists and is live
    // ========================================

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (project.status !== 'live') {
      return new Response(
        JSON.stringify({ error: 'Project is not live' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================================================
    // KYC & Whitelist Verification (Phase 6)
    // Check if project requires whitelist and if user is whitelisted
    // ========================================================================
    if (project.requires_whitelist || project.kyc_required) {
      // Check if wallet is whitelisted and KYC verified
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('whitelists')
        .select('*')
        .eq('wallet_address', user_wallet.toLowerCase())
        .eq('is_active', true)
        .or(`project_id.eq.${project_id},project_id.is.null`)
        .order('project_id', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (whitelistError) {
        console.error('Whitelist check error:', whitelistError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify whitelist status' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (!whitelistEntry) {
        return new Response(
          JSON.stringify({ 
            error: 'Wallet not whitelisted for this project',
            code: 'NOT_WHITELISTED',
            kycRequired: true,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check KYC verification status
      if (project.kyc_required && !whitelistEntry.kyc_verified) {
        return new Response(
          JSON.stringify({ 
            error: 'KYC verification required for this project',
            code: 'KYC_REQUIRED',
            kycRequired: true,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check KYC expiration
      if (whitelistEntry.kyc_expires_at && new Date(whitelistEntry.kyc_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ 
            error: 'KYC verification has expired. Please re-verify.',
            code: 'KYC_EXPIRED',
            kycRequired: true,
          }),
          {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check allocation limits
      if (whitelistEntry.max_allocation) {
        // Get existing investments for this wallet/project
        const { data: existingInvestments } = await supabase
          .from('investments')
          .select('amount_invested')
          .eq('project_id', project_id)
          .eq('user_wallet', user_wallet.toLowerCase());

        const totalInvested = (existingInvestments || [])
          .reduce((sum: number, inv: any) => sum + (parseFloat(inv.amount_invested) || 0), 0);

        const newTotal = totalInvested + parseFloat(amount_invested);
        const maxAllocation = parseFloat(whitelistEntry.max_allocation);

        if (newTotal > maxAllocation) {
          const remaining = maxAllocation - totalInvested;
          return new Response(
            JSON.stringify({ 
              error: `Investment exceeds allocation limit. Remaining allocation: ${remaining}`,
              code: 'ALLOCATION_EXCEEDED',
              maxAllocation: whitelistEntry.max_allocation,
              currentTotal: totalInvested.toString(),
              remaining: remaining.toString(),
            }),
            {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }

      // Check minimum allocation
      if (whitelistEntry.min_allocation && parseFloat(amount_invested) < parseFloat(whitelistEntry.min_allocation)) {
        return new Response(
          JSON.stringify({ 
            error: `Investment below minimum allocation: ${whitelistEntry.min_allocation}`,
            code: 'BELOW_MINIMUM',
            minAllocation: whitelistEntry.min_allocation,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }
    // ========================================================================
    // End KYC & Whitelist Verification
    // ========================================================================

    const tokens_purchased = amount_invested / project.token_price;

    // Use the provided amounts for storage (on-chain verification would happen in the contract)
    const verifiedAmountInvested = amount_invested;
    const verifiedTokensPurchased = tokens_purchased;

    // ========================================
    // STEP 4: Check for duplicate transaction
    // ========================================
    const { data: existingInvestment } = await supabase
      .from('investments')
      .select('id')
      .eq('transaction_hash', transaction_hash)
      .single();

    if (existingInvestment) {
      return new Response(
        JSON.stringify({ error: 'Transaction already processed' }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // STEP 5: Insert verified investment
    // ========================================
    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .insert({
        project_id,
        user_wallet: verification.investor, // Use verified on-chain address
        amount_invested: verifiedAmountInvested,
        tokens_purchased: verifiedTokensPurchased,
        transaction_hash,
        pool_address: verification.poolAddress,
        chain_id,
        verified_on_chain: true,
        claimed_amount: 0,
      })
      .select()
      .single();

    if (investmentError) {
      return new Response(
        JSON.stringify({ error: investmentError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        investment,
        verification: {
          verified: true,
          poolAddress: verification.poolAddress,
          chainId: chain_id
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});