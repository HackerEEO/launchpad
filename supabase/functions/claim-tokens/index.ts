import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { ethers } from 'npm:ethers@6.10.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// Event ABIs for decoding claim logs
const CLAIM_EVENT_ABI = [
  'event TokensClaimed(address indexed investor, uint256 amount)',
  'event TokensReleased(address indexed beneficiary, uint256 amount)' // TokenVesting event
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

interface ClaimVerificationResult {
  verified: boolean;
  source: 'onchain' | 'subgraph' | 'both';
  claimer?: string;
  amountClaimed?: string;
  contractAddress?: string;
  blockNumber?: number;
  confirmations?: number;
  error?: string;
}

/**
 * Query subgraph for token claim by transaction hash (optional cross-check)
 */
async function querySubgraphClaim(txHash: string): Promise<any | null> {
  if (!SUBGRAPH_URL) return null;
  
  try {
    const query = `{
      tokenClaims(where: { transactionHash: "${txHash.toLowerCase()}" }) {
        id
        investor
        amount
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
    return data?.data?.tokenClaims?.[0] || null;
  } catch (error) {
    console.error('Subgraph query failed:', error);
    return null;
  }
}

/**
 * Verify a claim transaction on-chain by checking the transaction receipt
 * and parsing the TokensClaimed or TokensReleased event from the logs
 */
async function verifyClaimTransaction(
  txHash: string,
  chainId: number,
  expectedClaimer: string
): Promise<ClaimVerificationResult> {
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

    // Parse claim events from logs
    const iface = new ethers.Interface(CLAIM_EVENT_ABI);
    
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
        
        if (parsed && (parsed.name === 'TokensClaimed' || parsed.name === 'TokensReleased')) {
          // Handle both event signatures
          const claimer = (parsed.args.investor || parsed.args.beneficiary).toLowerCase();
          const amountClaimed = parsed.args.amount.toString();

          // Verify the claimer matches
          if (claimer !== expectedClaimer.toLowerCase()) {
            return { 
              verified: false,
              source: 'onchain',
              error: `Claimer mismatch: expected ${expectedClaimer}, got ${claimer}` 
            };
          }

          // Optional: Cross-check with subgraph if available
          let source: 'onchain' | 'subgraph' | 'both' = 'onchain';
          const subgraphData = await querySubgraphClaim(txHash);
          
          if (subgraphData) {
            if (
              subgraphData.investor.toLowerCase() === claimer &&
              subgraphData.amount === amountClaimed
            ) {
              source = 'both';
            } else {
              console.warn('Subgraph data mismatch with on-chain data');
            }
          }

          return {
            verified: true,
            source,
            claimer,
            amountClaimed,
            contractAddress: log.address.toLowerCase(),
            blockNumber: receipt.blockNumber,
            confirmations,
          };
        }
      } catch {
        // Not a claim event, continue to next log
        continue;
      }
    }

    return { verified: false, source: 'onchain', error: 'No claim event found in transaction logs' };
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

    const { investment_id, user_wallet, transaction_hash, chain_id = 11155111 } = await req.json();

    if (!investment_id || !user_wallet || !transaction_hash) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: investment_id, user_wallet, transaction_hash' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // STEP 1: Verify claim transaction on-chain
    // ========================================
    const verification = await verifyClaimTransaction(
      transaction_hash,
      chain_id,
      user_wallet
    );

    if (!verification.verified) {
      return new Response(
        JSON.stringify({ 
          error: 'Claim verification failed', 
          details: verification.error 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // STEP 2: Fetch investment record
    // ========================================

    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .select('*, project:projects(*)')
      .eq('id', investment_id)
      .eq('user_wallet', user_wallet)
      .single();

    if (investmentError || !investment) {
      return new Response(
        JSON.stringify({ error: 'Investment not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // STEP 3: Use on-chain verified claim amount
    // ========================================
    // Convert from wei to token units (assuming 18 decimals)
    const onChainClaimWei = BigInt(verification.amountClaimed!);
    const verifiedClaimAmount = Number(onChainClaimWei) / 1e18;

    const claimable = investment.tokens_purchased - investment.claimed_amount;

    if (claimable <= 0) {
      return new Response(
        JSON.stringify({ error: 'No tokens available to claim' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate on-chain claim doesn't exceed claimable amount
    if (verifiedClaimAmount > claimable) {
      return new Response(
        JSON.stringify({ error: 'On-chain claim amount exceeds available tokens' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ========================================
    // STEP 4: Update investment with verified claim
    // ========================================
    const { data: updatedInvestment, error: updateError } = await supabase
      .from('investments')
      .update({
        claimed_amount: investment.claimed_amount + verifiedClaimAmount,
        last_claim_tx: transaction_hash,
        last_claim_at: new Date().toISOString(),
      })
      .eq('id', investment_id)
      .select()
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        claimed_amount: verifiedClaimAmount,
        investment: updatedInvestment,
        verification: {
          verified: true,
          contractAddress: verification.contractAddress,
          chainId: chain_id
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});