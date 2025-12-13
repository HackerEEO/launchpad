/**
 * KYC Create Session Edge Function
 * 
 * Creates a new KYC verification session with the provider (Sumsub).
 * Includes geo-restriction checks before session creation.
 * 
 * POST /functions/v1/kyc-create-session
 * Body: { walletAddress: string, userId?: string, projectId?: string }
 * 
 * Response:
 * - 200: { success: true, sessionUrl, accessToken, applicantId, expiresAt }
 * - 403: { success: false, error, geoBlocked: true, blockedCountry }
 * - 400/500: { success: false, error }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const KYC_PROVIDER_API_KEY = Deno.env.get('KYC_PROVIDER_API_KEY') || '';
const KYC_PROVIDER_SECRET = Deno.env.get('KYC_PROVIDER_SECRET') || '';
const SUMSUB_BASE_URL = Deno.env.get('SUMSUB_BASE_URL') || 'https://api.sumsub.com';
const SUMSUB_LEVEL_NAME = Deno.env.get('SUMSUB_LEVEL_NAME') || 'basic-kyc-level';
const GEOIP_API_KEY = Deno.env.get('GEOIP_API_KEY') || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// Sumsub API Helpers
// ============================================================================

function generateSignature(ts: number, method: string, path: string, body?: string): string {
  const data = ts + method.toUpperCase() + path + (body || '');
  return createHmac('sha256', KYC_PROVIDER_SECRET).update(data).digest('hex');
}

function getSumsubHeaders(method: string, path: string, body?: string): HeadersInit {
  const ts = Math.floor(Date.now() / 1000);
  const signature = generateSignature(ts, method, path, body);

  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-App-Token': KYC_PROVIDER_API_KEY,
    'X-App-Access-Ts': ts.toString(),
    'X-App-Access-Sig': signature,
  };
}

async function createApplicant(externalUserId: string): Promise<{ id: string }> {
  const path = `/resources/applicants?levelName=${encodeURIComponent(SUMSUB_LEVEL_NAME)}`;
  const body = JSON.stringify({ externalUserId });

  const response = await fetch(`${SUMSUB_BASE_URL}${path}`, {
    method: 'POST',
    headers: getSumsubHeaders('POST', path, body),
    body,
  });

  if (!response.ok) {
    if (response.status === 409) {
      // Applicant already exists, fetch existing
      return getApplicantByExternalId(externalUserId);
    }
    const error = await response.text();
    throw new Error(`Sumsub createApplicant failed: ${response.status} - ${error}`);
  }

  return response.json();
}

async function getApplicantByExternalId(externalUserId: string): Promise<{ id: string }> {
  const path = `/resources/applicants/-/externalUserId/${encodeURIComponent(externalUserId)}`;

  const response = await fetch(`${SUMSUB_BASE_URL}${path}`, {
    method: 'GET',
    headers: getSumsubHeaders('GET', path),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sumsub getApplicant failed: ${response.status} - ${error}`);
  }

  return response.json();
}

async function generateAccessToken(externalUserId: string): Promise<{ token: string }> {
  const ttlInSecs = 3600;
  const path = `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}&levelName=${encodeURIComponent(SUMSUB_LEVEL_NAME)}&ttlInSecs=${ttlInSecs}`;

  const response = await fetch(`${SUMSUB_BASE_URL}${path}`, {
    method: 'POST',
    headers: getSumsubHeaders('POST', path),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sumsub generateAccessToken failed: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============================================================================
// Geo Check Helpers
// ============================================================================

async function getCountryFromIp(ipAddress: string): Promise<string | null> {
  try {
    const url = GEOIP_API_KEY
      ? `https://ipinfo.io/${ipAddress}?token=${GEOIP_API_KEY}`
      : `https://ipinfo.io/${ipAddress}/json`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    return data.country || null;
  } catch {
    return null;
  }
}

async function isCountryBlocked(supabase: any, countryCode: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_country_blocked', {
    p_country_code: countryCode.toUpperCase(),
  });

  if (error) {
    console.error('is_country_blocked error:', error);
    return false;
  }

  return data === true;
}

function maskIpAddress(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  return ip;
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
    // Parse request body
    const body = await req.json();
    const { walletAddress, userId, projectId } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'walletAddress is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const wallet = walletAddress.toLowerCase();

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get client IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Check geo restrictions
    if (clientIp !== 'unknown') {
      const countryCode = await getCountryFromIp(clientIp);
      
      if (countryCode) {
        const blocked = await isCountryBlocked(supabase, countryCode);
        
        if (blocked) {
          // Log geo block audit
          await supabase.from('kyc_audit_logs').insert({
            action: 'geo_blocked',
            wallet_address: wallet,
            actor_type: 'system',
            details: { countryCode, ip: maskIpAddress(clientIp) },
            ip_address: maskIpAddress(clientIp),
          });

          return new Response(
            JSON.stringify({
              success: false,
              error: `KYC verification is not available in your region`,
              geoBlocked: true,
              blockedCountry: countryCode,
            }),
            { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Check for existing approved KYC
    const { data: existingKyc } = await supabase
      .from('kyc_requests')
      .select('*')
      .eq('wallet_address', wallet)
      .eq('normalized_status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingKyc) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'KYC already approved',
          kycStatus: 'approved',
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Validate provider credentials
    if (!KYC_PROVIDER_API_KEY || !KYC_PROVIDER_SECRET) {
      console.error('KYC provider credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'KYC service not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Create applicant and generate access token
    const applicant = await createApplicant(wallet);
    const tokenResponse = await generateAccessToken(wallet);
    
    const sessionUrl = `https://websdk.sumsub.com/?accessToken=${tokenResponse.token}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    // Store KYC request in database
    const { error: insertError } = await supabase.from('kyc_requests').insert({
      wallet_address: wallet,
      user_id: userId || null,
      project_id: projectId || null,
      provider: 'sumsub',
      provider_session_id: tokenResponse.token,
      provider_applicant_id: applicant.id,
      normalized_status: 'pending',
      ip_address: maskIpAddress(clientIp),
    });

    if (insertError) {
      console.error('Failed to insert KYC request:', insertError);
      // Continue anyway - session was created successfully
    }

    // Log audit
    await supabase.from('kyc_audit_logs').insert({
      action: 'session_created',
      wallet_address: wallet,
      actor_type: 'user',
      details: {
        provider: 'sumsub',
        applicantId: applicant.id,
      },
      ip_address: maskIpAddress(clientIp),
    });

    return new Response(
      JSON.stringify({
        success: true,
        sessionUrl,
        accessToken: tokenResponse.token,
        applicantId: applicant.id,
        expiresAt: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('KYC create-session error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
