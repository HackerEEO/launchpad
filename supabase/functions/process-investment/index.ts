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

// Network RPC URLs (configure in Supabase edge function secrets)
const RPC_URLS: Record<number, string> = {
  1: Deno.env.get('MAINNET_RPC_URL') ?? 'https://eth.llamarpc.com',
  11155111: Deno.env.get('SEPOLIA_RPC_URL') ?? 'https://rpc.sepolia.org',
  42161: Deno.env.get('ARBITRUM_RPC_URL') ?? 'https://arb1.arbitrum.io/rpc',
  8453: Deno.env.get('BASE_RPC_URL') ?? 'https://mainnet.base.org',
  137: Deno.env.get('POLYGON_RPC_URL') ?? 'https://polygon-rpc.com',
};

interface TransactionVerificationResult {
  verified: boolean;
  investor?: string;
  paymentAmount?: string;
  tokenAmount?: string;
  poolAddress?: string;
  error?: string;
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
    return { verified: false, error: `Unsupported chain ID: ${chainId}` };
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { verified: false, error: 'Transaction not found or not yet confirmed' };
    }

    // Check transaction was successful
    if (receipt.status !== 1) {
      return { verified: false, error: 'Transaction failed on-chain' };
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
              error: `Investor mismatch: expected ${expectedInvestor}, got ${investor}` 
            };
          }

          return {
            verified: true,
            investor,
            paymentAmount,
            tokenAmount,
            poolAddress: log.address.toLowerCase()
          };
        }
      } catch {
        // Not an Investment event, continue to next log
        continue;
      }
    }

    return { verified: false, error: 'No Investment event found in transaction logs' };
  } catch (error) {
    return { verified: false, error: `Verification failed: ${(error as Error).message}` };
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

    // ========================================
    // STEP 3: Calculate tokens and use verified on-chain data
    // ========================================
    // Use the on-chain verified payment amount (in wei) for trust
    const onChainPaymentWei = BigInt(verification.paymentAmount!);
    const onChainTokens = BigInt(verification.tokenAmount!);
    
    // Convert wei to ETH for display (18 decimals)
    const onChainPaymentEth = Number(onChainPaymentWei) / 1e18;
    const tokensFromOnChain = Number(onChainTokens) / 1e18; // Assuming 18 decimals

    // Use the on-chain verified amounts for storage
    const verifiedAmountInvested = onChainPaymentEth;
    const verifiedTokensPurchased = tokensFromOnChain;

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
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});