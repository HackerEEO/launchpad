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

    const { investment_id, user_wallet } = await req.json();

    if (!investment_id || !user_wallet) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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

    const vesting = investment.project.vesting_schedule || { tge_percent: 100 };
    const tgeAmount = (investment.tokens_purchased * vesting.tge_percent) / 100;
    const claimAmount = Math.min(tgeAmount, claimable);

    const { data: updatedInvestment, error: updateError } = await supabase
      .from('investments')
      .update({
        claimed_amount: investment.claimed_amount + claimAmount,
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
        claimed_amount: claimAmount,
        investment: updatedInvestment,
      }),
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