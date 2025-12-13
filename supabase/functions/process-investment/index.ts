import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    const { project_id, user_wallet, amount_invested, transaction_hash } = await req.json();

    if (!project_id || !user_wallet || !amount_invested) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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

    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .insert({
        project_id,
        user_wallet,
        amount_invested,
        tokens_purchased,
        transaction_hash,
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
      JSON.stringify({ success: true, investment }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});