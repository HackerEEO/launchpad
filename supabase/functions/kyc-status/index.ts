/**
 * KYC Status Edge Function
 * 
 * Returns KYC verification and whitelist status for a wallet address.
 * 
 * GET /functions/v1/kyc-status?wallet=0x...&projectId=...
 * 
 * Response:
 * - 200: { walletAddress, kycStatus, kycVerified, whitelisted, ... }
 * - 400: { success: false, error }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

// ============================================================================
// Request Handler
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const walletAddress = url.searchParams.get('wallet');
    const projectId = url.searchParams.get('projectId');

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ success: false, error: 'wallet parameter is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const wallet = walletAddress.toLowerCase();

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get latest KYC request
    const { data: kycRequest, error: kycError } = await supabase
      .from('kyc_requests')
      .select('*')
      .eq('wallet_address', wallet)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kycError) {
      console.error('Error fetching KYC request:', kycError);
    }

    // Get whitelist entry
    let whitelistQuery = supabase
      .from('whitelists')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('is_active', true);

    if (projectId) {
      // Get project-specific or platform-wide whitelist
      whitelistQuery = whitelistQuery.or(`project_id.eq.${projectId},project_id.is.null`);
    }

    const { data: whitelistEntries, error: whitelistError } = await whitelistQuery
      .order('project_id', { ascending: false, nullsFirst: false })
      .limit(1);

    if (whitelistError) {
      console.error('Error fetching whitelist:', whitelistError);
    }

    const whitelist = whitelistEntries?.[0] || null;

    // Check if KYC has expired
    const kycExpired = whitelist?.kyc_expires_at
      ? new Date(whitelist.kyc_expires_at) < new Date()
      : false;

    // Build response
    const response = {
      success: true,
      walletAddress: wallet,
      
      // KYC Status
      kycStatus: kycRequest?.normalized_status || 'none',
      kycProvider: kycRequest?.provider || null,
      kycVerified: kycRequest?.normalized_status === 'approved' && !kycExpired,
      kycExpiresAt: whitelist?.kyc_expires_at || null,
      kycExpired,
      
      // If pending/processing, include session info
      kycPending: ['pending', 'processing'].includes(kycRequest?.normalized_status),
      
      // Rejection info (if applicable)
      rejectionReason: kycRequest?.normalized_status === 'rejected' 
        ? kycRequest?.rejection_reason 
        : null,
      
      // Whitelist Status
      whitelisted: whitelist?.kyc_verified === true && !kycExpired,
      whitelistTier: whitelist?.tier || null,
      maxAllocation: whitelist?.max_allocation?.toString() || null,
      minAllocation: whitelist?.min_allocation?.toString() || null,
      
      // Geo blocking
      geoBlocked: kycRequest?.geo_blocked || false,
      
      // Timestamps
      kycCreatedAt: kycRequest?.created_at || null,
      kycUpdatedAt: kycRequest?.updated_at || null,
      whitelistCreatedAt: whitelist?.created_at || null,
      
      // For project-specific queries
      projectId: projectId || null,
      projectSpecificWhitelist: whitelist?.project_id !== null,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('KYC status error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
