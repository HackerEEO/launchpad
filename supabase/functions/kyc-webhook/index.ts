/**
 * KYC Webhook Edge Function
 * 
 * Receives webhook callbacks from KYC provider (Sumsub).
 * Verifies signature, updates KYC request status, and creates whitelist entries.
 * 
 * POST /functions/v1/kyc-webhook
 * Headers: x-payload-digest (HMAC signature from Sumsub)
 * Body: Sumsub webhook payload
 * 
 * Response:
 * - 200: { success: true }
 * - 401: { success: false, error: 'Invalid signature' }
 * - 500: { success: false, error }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const KYC_PROVIDER_SECRET = Deno.env.get('KYC_PROVIDER_SECRET') || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-payload-digest',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// Types
// ============================================================================

interface SumsubWebhookPayload {
  applicantId: string;
  inspectionId: string;
  correlationId: string;
  externalUserId: string;
  levelName: string;
  type: string;
  sandboxMode: boolean;
  reviewStatus?: string;
  reviewResult?: {
    reviewAnswer: 'GREEN' | 'RED' | 'YELLOW';
    rejectLabels?: string[];
    moderationComment?: string;
    clientComment?: string;
    reviewRejectType?: string;
  };
  createdAtMs: number;
  clientId: string;
}

type NormalizedStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'expired' | 'retry';

// ============================================================================
// Signature Verification
// ============================================================================

function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  if (!signature || !KYC_PROVIDER_SECRET) {
    return false;
  }

  const expectedSignature = createHmac('sha256', KYC_PROVIDER_SECRET)
    .update(payload)
    .digest('hex');

  // Constant-time comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

// ============================================================================
// Status Mapping
// ============================================================================

function mapReviewStatus(
  reviewStatus?: string,
  reviewAnswer?: 'GREEN' | 'RED' | 'YELLOW'
): NormalizedStatus {
  if (reviewAnswer) {
    switch (reviewAnswer) {
      case 'GREEN':
        return 'approved';
      case 'RED':
        return 'rejected';
      case 'YELLOW':
        return 'retry';
    }
  }

  switch (reviewStatus) {
    case 'completed':
      return 'approved';
    case 'pending':
    case 'queued':
      return 'processing';
    case 'init':
      return 'pending';
    case 'onHold':
      return 'retry';
    default:
      return 'pending';
  }
}

function sanitizeProviderResponse(payload: SumsubWebhookPayload): Record<string, unknown> {
  return {
    applicantId: payload.applicantId,
    inspectionId: payload.inspectionId,
    type: payload.type,
    levelName: payload.levelName,
    sandboxMode: payload.sandboxMode,
    reviewStatus: payload.reviewStatus,
    reviewResult: payload.reviewResult ? {
      reviewAnswer: payload.reviewResult.reviewAnswer,
      rejectLabels: payload.reviewResult.rejectLabels,
      reviewRejectType: payload.reviewResult.reviewRejectType,
    } : undefined,
    createdAtMs: payload.createdAtMs,
    // Exclude: clientId, correlationId, externalUserId (we have wallet address)
  };
}

// ============================================================================
// Request Handler
// ============================================================================

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Verify signature (Sumsub uses x-payload-digest header)
    const signature = req.headers.get('x-payload-digest');
    
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid signature' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Parse payload
    const payload: SumsubWebhookPayload = JSON.parse(rawBody);
    console.log('Received webhook:', payload.type, 'for applicant:', payload.applicantId);

    // Skip non-relevant webhook types
    const relevantTypes = [
      'applicantCreated',
      'applicantPending',
      'applicantReviewed',
      'applicantOnHold',
      'applicantActionPending',
      'applicantActionCompleted',
    ];

    if (!relevantTypes.includes(payload.type)) {
      console.log('Skipping non-relevant webhook type:', payload.type);
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Normalize status
    const walletAddress = payload.externalUserId.toLowerCase();
    const normalizedStatus = mapReviewStatus(
      payload.reviewStatus,
      payload.reviewResult?.reviewAnswer
    );

    const rejectionLabels = payload.reviewResult?.rejectLabels || [];
    const rejectionReason = rejectionLabels.length > 0
      ? rejectionLabels.join(', ')
      : payload.reviewResult?.moderationComment || null;

    // Update KYC request
    const { error: updateError } = await supabase
      .from('kyc_requests')
      .update({
        provider_status: payload.reviewStatus || payload.type,
        normalized_status: normalizedStatus,
        rejection_reason: rejectionReason,
        reviewed_at: new Date(payload.createdAtMs).toISOString(),
        provider_response: sanitizeProviderResponse(payload),
        updated_at: new Date().toISOString(),
      })
      .eq('wallet_address', walletAddress)
      .eq('provider_applicant_id', payload.applicantId);

    if (updateError) {
      console.error('Failed to update KYC request:', updateError);
      // Try to find by just wallet address (in case applicant ID changed)
      await supabase
        .from('kyc_requests')
        .update({
          provider_status: payload.reviewStatus || payload.type,
          normalized_status: normalizedStatus,
          rejection_reason: rejectionReason,
          provider_applicant_id: payload.applicantId,
          reviewed_at: new Date(payload.createdAtMs).toISOString(),
          provider_response: sanitizeProviderResponse(payload),
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    // Get the KYC request ID for audit log
    const { data: kycRequest } = await supabase
      .from('kyc_requests')
      .select('id, project_id')
      .eq('wallet_address', walletAddress)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If approved, create/update whitelist entry
    if (normalizedStatus === 'approved') {
      // Calculate expiry (1 year from now)
      const kycExpiresAt = new Date();
      kycExpiresAt.setFullYear(kycExpiresAt.getFullYear() + 1);

      const { error: whitelistError } = await supabase
        .from('whitelists')
        .upsert({
          wallet_address: walletAddress,
          project_id: kycRequest?.project_id || null,
          tier: 'bronze', // Default tier, can be upgraded by admin
          kyc_verified: true,
          kyc_provider: 'sumsub',
          kyc_request_id: kycRequest?.id || null,
          kyc_timestamp: new Date(payload.createdAtMs).toISOString(),
          kyc_expires_at: kycExpiresAt.toISOString(),
          is_active: true,
        }, {
          onConflict: 'wallet_address,project_id',
        });

      if (whitelistError) {
        console.error('Failed to upsert whitelist:', whitelistError);
      } else {
        // Log whitelist creation
        await supabase.from('kyc_audit_logs').insert({
          action: 'whitelist_added',
          wallet_address: walletAddress,
          kyc_request_id: kycRequest?.id || null,
          project_id: kycRequest?.project_id || null,
          actor_type: 'webhook',
          details: {
            provider: 'sumsub',
            tier: 'bronze',
            kycExpiresAt: kycExpiresAt.toISOString(),
          },
        });
      }
    }

    // Log webhook receipt audit
    await supabase.from('kyc_audit_logs').insert({
      action: 'webhook_received',
      wallet_address: walletAddress,
      kyc_request_id: kycRequest?.id || null,
      actor_type: 'webhook',
      details: {
        provider: 'sumsub',
        webhookType: payload.type,
        normalizedStatus,
        reviewAnswer: payload.reviewResult?.reviewAnswer,
      },
    });

    // Also log status update
    await supabase.from('kyc_audit_logs').insert({
      action: 'status_updated',
      wallet_address: walletAddress,
      kyc_request_id: kycRequest?.id || null,
      actor_type: 'webhook',
      details: {
        previousStatus: 'unknown', // We don't track previous in webhook
        newStatus: normalizedStatus,
        provider: 'sumsub',
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('KYC webhook error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
