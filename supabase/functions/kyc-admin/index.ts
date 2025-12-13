/**
 * KYC Admin Edge Function
 * 
 * Admin endpoints for KYC management:
 * - GET: List pending reviews, search by wallet
 * - POST: Manual approve/reject, bulk upload
 * 
 * Requires admin authentication.
 * 
 * GET /functions/v1/kyc-admin?action=pending&limit=50&offset=0
 * GET /functions/v1/kyc-admin?action=search&wallet=0x...
 * POST /functions/v1/kyc-admin { action: 'approve', walletAddress, ... }
 * POST /functions/v1/kyc-admin { action: 'reject', walletAddress, ... }
 * POST /functions/v1/kyc-admin { action: 'bulk-upload', entries: [...] }
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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ============================================================================
// Auth Helper
// ============================================================================

async function verifyAdminAuth(req: Request, supabase: any): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { valid: false, error: 'Invalid token' };
  }

  // Check if user is admin (you may have a different admin check)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('wallet_address, is_admin')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.is_admin) {
    return { valid: false, error: 'Unauthorized - admin access required' };
  }

  return { valid: true, userId: user.id };
}

// ============================================================================
// GET Handlers
// ============================================================================

async function handleGetRequest(req: Request, supabase: any): Promise<Response> {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'pending';

  switch (action) {
    case 'pending':
      return getPendingReviews(url, supabase);
    case 'search':
      return searchByWallet(url, supabase);
    case 'stats':
      return getKycStats(supabase);
    default:
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
  }
}

async function getPendingReviews(url: URL, supabase: any): Promise<Response> {
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const projectId = url.searchParams.get('projectId');

  let query = supabase
    .from('kyc_requests')
    .select('*, whitelists(*)', { count: 'exact' })
    .in('normalized_status', ['pending', 'processing', 'retry'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error, count } = await query;

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, data, total: count, limit, offset }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

async function searchByWallet(url: URL, supabase: any): Promise<Response> {
  const wallet = url.searchParams.get('wallet')?.toLowerCase();

  if (!wallet) {
    return new Response(
      JSON.stringify({ success: false, error: 'wallet parameter required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Get KYC requests
  const { data: kycRequests, error: kycError } = await supabase
    .from('kyc_requests')
    .select('*')
    .eq('wallet_address', wallet)
    .order('created_at', { ascending: false });

  // Get whitelist entries
  const { data: whitelists, error: whitelistError } = await supabase
    .from('whitelists')
    .select('*')
    .eq('wallet_address', wallet);

  // Get audit logs
  const { data: auditLogs, error: auditError } = await supabase
    .from('kyc_audit_logs')
    .select('*')
    .eq('wallet_address', wallet)
    .order('created_at', { ascending: false })
    .limit(50);

  if (kycError || whitelistError || auditError) {
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch data' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      walletAddress: wallet,
      kycRequests,
      whitelists,
      auditLogs,
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

async function getKycStats(supabase: any): Promise<Response> {
  // Get counts by status
  const { data: statusCounts, error: statusError } = await supabase
    .from('kyc_requests')
    .select('normalized_status')
    .then((result: any) => {
      if (result.error) return result;
      
      const counts: Record<string, number> = {};
      for (const row of result.data || []) {
        counts[row.normalized_status] = (counts[row.normalized_status] || 0) + 1;
      }
      return { data: counts, error: null };
    });

  // Get whitelist counts
  const { count: totalWhitelisted } = await supabase
    .from('whitelists')
    .select('*', { count: 'exact', head: true })
    .eq('kyc_verified', true)
    .eq('is_active', true);

  // Get pending review count
  const { count: pendingReviews } = await supabase
    .from('kyc_requests')
    .select('*', { count: 'exact', head: true })
    .eq('review_required', true);

  if (statusError) {
    return new Response(
      JSON.stringify({ success: false, error: statusError.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      stats: {
        byStatus: statusCounts,
        totalWhitelisted,
        pendingReviews,
      },
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

// ============================================================================
// POST Handlers
// ============================================================================

async function handlePostRequest(req: Request, supabase: any, adminId: string): Promise<Response> {
  const body = await req.json();
  const action = body.action;

  switch (action) {
    case 'approve':
      return manualApprove(body, supabase, adminId);
    case 'reject':
      return manualReject(body, supabase, adminId);
    case 'bulk-upload':
      return bulkUpload(body, supabase, adminId);
    default:
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
  }
}

async function manualApprove(body: any, supabase: any, adminId: string): Promise<Response> {
  const { walletAddress, projectId, tier, maxAllocation, notes } = body;

  if (!walletAddress) {
    return new Response(
      JSON.stringify({ success: false, error: 'walletAddress required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const wallet = walletAddress.toLowerCase();
  const kycExpiresAt = new Date();
  kycExpiresAt.setFullYear(kycExpiresAt.getFullYear() + 1);

  // Upsert whitelist entry
  const { error: whitelistError } = await supabase
    .from('whitelists')
    .upsert({
      wallet_address: wallet,
      project_id: projectId || null,
      tier: tier || 'bronze',
      max_allocation: maxAllocation || null,
      kyc_verified: true,
      kyc_provider: 'manual',
      kyc_timestamp: new Date().toISOString(),
      kyc_expires_at: kycExpiresAt.toISOString(),
      manually_approved: true,
      approved_by: adminId,
      approval_notes: notes || 'Manual approval by admin',
      is_active: true,
    }, {
      onConflict: 'wallet_address,project_id',
    });

  if (whitelistError) {
    return new Response(
      JSON.stringify({ success: false, error: whitelistError.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Log audit
  await supabase.from('kyc_audit_logs').insert({
    action: 'manual_approve',
    wallet_address: wallet,
    project_id: projectId || null,
    actor_type: 'admin',
    actor_id: adminId,
    details: { tier, maxAllocation, notes },
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Wallet approved successfully' }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

async function manualReject(body: any, supabase: any, adminId: string): Promise<Response> {
  const { walletAddress, projectId, reason } = body;

  if (!walletAddress) {
    return new Response(
      JSON.stringify({ success: false, error: 'walletAddress required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  const wallet = walletAddress.toLowerCase();

  // Deactivate whitelist entry
  let query = supabase
    .from('whitelists')
    .update({
      is_active: false,
      kyc_verified: false,
      approval_notes: reason || 'Manually rejected by admin',
    })
    .eq('wallet_address', wallet);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { error } = await query;

  if (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Log audit
  await supabase.from('kyc_audit_logs').insert({
    action: 'manual_reject',
    wallet_address: wallet,
    project_id: projectId || null,
    actor_type: 'admin',
    actor_id: adminId,
    details: { reason },
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Wallet rejected successfully' }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

async function bulkUpload(body: any, supabase: any, adminId: string): Promise<Response> {
  const { entries } = body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'entries array required' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  // Limit bulk upload size
  if (entries.length > 1000) {
    return new Response(
      JSON.stringify({ success: false, error: 'Maximum 1000 entries per upload' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  let successCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  const kycExpiresAt = new Date();
  kycExpiresAt.setFullYear(kycExpiresAt.getFullYear() + 1);

  for (const entry of entries) {
    if (!entry.walletAddress) {
      failedCount++;
      errors.push('Missing walletAddress in entry');
      continue;
    }

    const wallet = entry.walletAddress.toLowerCase();

    const { error } = await supabase
      .from('whitelists')
      .upsert({
        wallet_address: wallet,
        project_id: entry.projectId || null,
        tier: entry.tier || 'bronze',
        max_allocation: entry.maxAllocation || null,
        kyc_verified: true,
        kyc_provider: 'manual',
        kyc_timestamp: new Date().toISOString(),
        kyc_expires_at: kycExpiresAt.toISOString(),
        manually_approved: true,
        approved_by: adminId,
        approval_notes: 'Bulk CSV upload',
        is_active: true,
      }, {
        onConflict: 'wallet_address,project_id',
      });

    if (error) {
      failedCount++;
      errors.push(`${wallet}: ${error.message}`);
    } else {
      successCount++;
    }
  }

  // Log bulk upload audit
  await supabase.from('kyc_audit_logs').insert({
    action: 'bulk_upload',
    actor_type: 'admin',
    actor_id: adminId,
    details: {
      totalEntries: entries.length,
      success: successCount,
      failed: failedCount,
    },
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: `Processed ${entries.length} entries`,
      successCount,
      failedCount,
      errors: errors.slice(0, 10), // Limit error messages
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
  );
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify admin authentication
    const auth = await verifyAdminAuth(req, supabase);
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ success: false, error: auth.error }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      return handleGetRequest(req, supabase);
    } else if (req.method === 'POST') {
      return handlePostRequest(req, supabase, auth.userId!);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('KYC admin error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
