/**
 * KYC Service
 * 
 * Orchestrates KYC verification flow, geo checks, and whitelist management.
 * Uses provider adapters for actual KYC verification.
 */

import { SumsubAdapter, createSumsubAdapter, type NormalizedKycResult } from './adapters/sumsub';

// ============================================================================
// Types
// ============================================================================

export type KycProvider = 'sumsub' | 'synaps' | 'onfido' | 'civic';

export interface KycSessionRequest {
  walletAddress: string;
  userId?: string;
  projectId?: string;
  ipAddress?: string;
}

export interface KycSessionResponse {
  success: boolean;
  sessionUrl?: string;
  accessToken?: string;
  applicantId?: string;
  expiresAt?: Date;
  error?: string;
  geoBlocked?: boolean;
  blockedCountry?: string;
}

export interface KycStatusResponse {
  walletAddress: string;
  kycStatus: NormalizedKycResult['status'];
  kycProvider?: KycProvider;
  kycVerified: boolean;
  kycExpiresAt?: Date;
  whitelisted: boolean;
  whitelistTier?: string;
  maxAllocation?: string;
  geoBlocked: boolean;
}

export interface WhitelistEntry {
  walletAddress: string;
  projectId?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'guaranteed';
  maxAllocation?: string;
  minAllocation?: string;
  kycVerified: boolean;
  manuallyApproved?: boolean;
  approvedBy?: string;
  approvalNotes?: string;
}

export interface GeoCheckResult {
  allowed: boolean;
  countryCode?: string;
  countryName?: string;
  blockedReason?: string;
  requiresManualReview?: boolean;
}

export interface AuditLogEntry {
  action: string;
  walletAddress?: string;
  userId?: string;
  kycRequestId?: string;
  whitelistId?: string;
  projectId?: string;
  actorType: 'system' | 'admin' | 'webhook' | 'user';
  actorId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

// ============================================================================
// KYC Service Class
// ============================================================================

export class KycService {
  private sumsubAdapter: SumsubAdapter | null = null;
  private supabaseUrl: string;
  private supabaseKey: string;
  private geoIpApiKey: string | null;
  private kycRetentionDays: number;

  constructor(config: {
    supabaseUrl: string;
    supabaseKey: string;
    geoIpApiKey?: string;
    kycRetentionDays?: number;
  }) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
    this.geoIpApiKey = config.geoIpApiKey || null;
    this.kycRetentionDays = config.kycRetentionDays || 365;
  }

  /**
   * Get or create the KYC provider adapter
   */
  private getAdapter(): SumsubAdapter {
    if (!this.sumsubAdapter) {
      this.sumsubAdapter = createSumsubAdapter();
    }
    return this.sumsubAdapter;
  }

  // ==========================================================================
  // Session Management
  // ==========================================================================

  /**
   * Create a new KYC verification session
   */
  async createSession(request: KycSessionRequest): Promise<KycSessionResponse> {
    const walletAddress = request.walletAddress.toLowerCase();

    try {
      // Step 1: Check geo restrictions
      if (request.ipAddress) {
        const geoCheck = await this.checkGeoRestrictions(request.ipAddress);
        if (!geoCheck.allowed) {
          await this.logAudit({
            action: 'geo_blocked',
            walletAddress,
            actorType: 'system',
            details: {
              countryCode: geoCheck.countryCode,
              reason: geoCheck.blockedReason,
            },
            ipAddress: this.maskIpAddress(request.ipAddress),
          });

          return {
            success: false,
            error: `KYC not available in ${geoCheck.countryName || geoCheck.countryCode}`,
            geoBlocked: true,
            blockedCountry: geoCheck.countryCode,
          };
        }
      }

      // Step 2: Check for existing pending/approved KYC
      const existing = await this.getExistingKycRequest(walletAddress);
      if (existing?.normalized_status === 'approved') {
        return {
          success: true,
          error: 'KYC already approved',
        };
      }

      // Step 3: Create session with provider
      const adapter = this.getAdapter();
      const externalUserId = walletAddress; // Use wallet as external ID
      const result = await adapter.createSession(externalUserId);

      // Step 4: Store KYC request in database
      await this.createKycRequest({
        walletAddress,
        userId: request.userId,
        projectId: request.projectId,
        provider: 'sumsub',
        providerSessionId: result.accessToken,
        providerApplicantId: result.applicantId,
        ipAddress: request.ipAddress ? this.maskIpAddress(request.ipAddress) : undefined,
      });

      // Step 5: Log audit
      await this.logAudit({
        action: 'session_created',
        walletAddress,
        actorType: 'user',
        details: {
          provider: 'sumsub',
          applicantId: result.applicantId,
        },
        ipAddress: request.ipAddress ? this.maskIpAddress(request.ipAddress) : undefined,
      });

      return {
        success: true,
        sessionUrl: result.sessionUrl,
        accessToken: result.accessToken,
        applicantId: result.applicantId,
        expiresAt: result.expiresAt,
      };

    } catch (error) {
      console.error('KYC createSession error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create KYC session',
      };
    }
  }

  /**
   * Get KYC and whitelist status for a wallet
   */
  async getStatus(walletAddress: string, projectId?: string): Promise<KycStatusResponse> {
    const wallet = walletAddress.toLowerCase();

    // Get latest KYC request
    const kycRequest = await this.getExistingKycRequest(wallet);

    // Get whitelist entry
    const whitelist = await this.getWhitelistEntry(wallet, projectId);

    // Check if country is blocked (from last KYC request)
    const geoBlocked = kycRequest?.geo_blocked ?? false;

    return {
      walletAddress: wallet,
      kycStatus: (kycRequest?.normalized_status as NormalizedKycResult['status']) || 'pending',
      kycProvider: kycRequest?.provider as KycProvider,
      kycVerified: kycRequest?.normalized_status === 'approved',
      kycExpiresAt: kycRequest?.expires_at ? new Date(kycRequest.expires_at) : undefined,
      whitelisted: whitelist?.kyc_verified === true && whitelist?.is_active === true,
      whitelistTier: whitelist?.tier,
      maxAllocation: whitelist?.max_allocation?.toString(),
      geoBlocked,
    };
  }

  // ==========================================================================
  // Webhook Processing
  // ==========================================================================

  /**
   * Process webhook callback from KYC provider
   */
  async processWebhook(
    payload: string,
    signature: string | null,
    provider: KycProvider = 'sumsub'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (provider !== 'sumsub') {
        throw new Error(`Provider ${provider} not supported`);
      }

      const adapter = this.getAdapter();

      // Verify signature
      if (!adapter.verifyWebhookSignature(payload, signature)) {
        console.error('Invalid webhook signature');
        return { success: false, error: 'Invalid signature' };
      }

      // Parse and normalize payload
      const webhookData = adapter.parseWebhookPayload(payload);
      const normalized = adapter.normalizeWebhookPayload(webhookData);

      // Get wallet address from external user ID
      const walletAddress = normalized.externalId.toLowerCase();

      // Update KYC request in database
      await this.updateKycRequest({
        walletAddress,
        providerApplicantId: normalized.proof.applicantId,
        providerStatus: webhookData.reviewStatus || webhookData.type,
        normalizedStatus: normalized.status,
        rejectionReason: normalized.rejectionReason,
        countryCode: normalized.countryCode,
        reviewedAt: normalized.reviewedAt,
        providerResponse: SumsubAdapter.sanitizeForStorage(webhookData as any),
      });

      // If approved, create/update whitelist entry
      if (normalized.status === 'approved') {
        await this.createOrUpdateWhitelist({
          walletAddress,
          kycVerified: true,
          kycProvider: 'sumsub',
          kycTimestamp: normalized.reviewedAt,
        });
      }

      // Log audit
      await this.logAudit({
        action: 'webhook_received',
        walletAddress,
        actorType: 'webhook',
        details: {
          provider: 'sumsub',
          type: webhookData.type,
          status: normalized.status,
        },
      });

      return { success: true };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      };
    }
  }

  // ==========================================================================
  // Geo Restrictions
  // ==========================================================================

  /**
   * Check if IP address is from a blocked country
   */
  async checkGeoRestrictions(ipAddress: string): Promise<GeoCheckResult> {
    try {
      // Get country from IP
      const geoInfo = await this.getGeoFromIp(ipAddress);
      
      if (!geoInfo.countryCode) {
        return { allowed: true }; // Can't determine, allow with caution
      }

      // Check against blocked countries
      const isBlocked = await this.isCountryBlocked(geoInfo.countryCode);

      if (isBlocked) {
        return {
          allowed: false,
          countryCode: geoInfo.countryCode,
          countryName: geoInfo.countryName,
          blockedReason: 'Country is on restricted list',
        };
      }

      return {
        allowed: true,
        countryCode: geoInfo.countryCode,
        countryName: geoInfo.countryName,
      };

    } catch (error) {
      console.error('Geo check error:', error);
      // On error, allow but flag for review
      return {
        allowed: true,
        requiresManualReview: true,
      };
    }
  }

  /**
   * Get geographic info from IP address using ipinfo.io
   */
  private async getGeoFromIp(ipAddress: string): Promise<{
    countryCode?: string;
    countryName?: string;
    city?: string;
    region?: string;
  }> {
    if (!this.geoIpApiKey) {
      // Use free tier without API key
      const response = await fetch(`https://ipinfo.io/${ipAddress}/json`);
      if (!response.ok) {
        throw new Error(`ipinfo.io request failed: ${response.status}`);
      }
      const data = await response.json();
      return {
        countryCode: data.country,
        city: data.city,
        region: data.region,
      };
    }

    const response = await fetch(
      `https://ipinfo.io/${ipAddress}?token=${this.geoIpApiKey}`
    );

    if (!response.ok) {
      throw new Error(`ipinfo.io request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      countryCode: data.country,
      countryName: data.country_name,
      city: data.city,
      region: data.region,
    };
  }

  /**
   * Check if country code is blocked
   */
  private async isCountryBlocked(countryCode: string): Promise<boolean> {
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/rpc/is_country_blocked`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({ p_country_code: countryCode.toUpperCase() }),
      }
    );

    if (!response.ok) {
      console.error('is_country_blocked RPC failed:', await response.text());
      return false;
    }

    return await response.json();
  }

  // ==========================================================================
  // Whitelist Management
  // ==========================================================================

  /**
   * Create or update whitelist entry
   */
  async createOrUpdateWhitelist(entry: Partial<WhitelistEntry> & {
    walletAddress: string;
    kycVerified?: boolean;
    kycProvider?: string;
    kycTimestamp?: Date;
    kycRequestId?: string;
  }): Promise<void> {
    const wallet = entry.walletAddress.toLowerCase();

    const body = {
      wallet_address: wallet,
      project_id: entry.projectId || null,
      tier: entry.tier || 'bronze',
      max_allocation: entry.maxAllocation || null,
      min_allocation: entry.minAllocation || null,
      kyc_verified: entry.kycVerified ?? false,
      kyc_provider: entry.kycProvider || null,
      kyc_timestamp: entry.kycTimestamp?.toISOString() || null,
      kyc_request_id: entry.kycRequestId || null,
      manually_approved: entry.manuallyApproved ?? false,
      approved_by: entry.approvedBy || null,
      approval_notes: entry.approvalNotes || null,
      is_active: true,
    };

    // Upsert whitelist entry
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/whitelists`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upsert whitelist: ${error}`);
    }

    // Log audit
    await this.logAudit({
      action: 'whitelist_added',
      walletAddress: wallet,
      projectId: entry.projectId,
      actorType: entry.manuallyApproved ? 'admin' : 'system',
      actorId: entry.approvedBy,
      details: {
        tier: entry.tier,
        kycVerified: entry.kycVerified,
        manuallyApproved: entry.manuallyApproved,
      },
    });
  }

  /**
   * Bulk upload whitelist entries from CSV data
   */
  async bulkUploadWhitelist(
    entries: Array<{
      walletAddress: string;
      projectId?: string;
      tier?: string;
      maxAllocation?: string;
    }>,
    adminId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        await this.createOrUpdateWhitelist({
          walletAddress: entry.walletAddress,
          projectId: entry.projectId,
          tier: (entry.tier as WhitelistEntry['tier']) || 'bronze',
          maxAllocation: entry.maxAllocation,
          manuallyApproved: true,
          approvedBy: adminId,
          approvalNotes: 'Bulk CSV upload',
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`${entry.walletAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log bulk upload audit
    await this.logAudit({
      action: 'bulk_upload',
      actorType: 'admin',
      actorId: adminId,
      details: {
        totalEntries: entries.length,
        success,
        failed,
      },
    });

    return { success, failed, errors };
  }

  /**
   * Get whitelist entry for wallet
   */
  private async getWhitelistEntry(
    walletAddress: string,
    projectId?: string
  ): Promise<Record<string, any> | null> {
    let url = `${this.supabaseUrl}/rest/v1/whitelists?wallet_address=eq.${walletAddress}`;
    
    if (projectId) {
      url += `&or=(project_id.eq.${projectId},project_id.is.null)`;
    }

    url += '&order=project_id.nulls.last&limit=1';

    const response = await fetch(url, {
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
      },
    });

    if (!response.ok) {
      console.error('getWhitelistEntry failed:', await response.text());
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  }

  // ==========================================================================
  // Admin Functions
  // ==========================================================================

  /**
   * Manually approve a wallet for whitelist
   */
  async manualApprove(
    walletAddress: string,
    adminId: string,
    options: {
      projectId?: string;
      tier?: WhitelistEntry['tier'];
      maxAllocation?: string;
      notes?: string;
    } = {}
  ): Promise<void> {
    await this.createOrUpdateWhitelist({
      walletAddress,
      projectId: options.projectId,
      tier: options.tier || 'bronze',
      maxAllocation: options.maxAllocation,
      kycVerified: true, // Manual approval grants KYC verified status
      manuallyApproved: true,
      approvedBy: adminId,
      approvalNotes: options.notes || 'Manual approval by admin',
    });

    await this.logAudit({
      action: 'manual_approve',
      walletAddress,
      projectId: options.projectId,
      actorType: 'admin',
      actorId: adminId,
      details: {
        tier: options.tier,
        maxAllocation: options.maxAllocation,
        notes: options.notes,
      },
    });
  }

  /**
   * Manually reject/remove a wallet from whitelist
   */
  async manualReject(
    walletAddress: string,
    adminId: string,
    options: {
      projectId?: string;
      reason?: string;
    } = {}
  ): Promise<void> {
    const wallet = walletAddress.toLowerCase();

    // Deactivate whitelist entry
    let url = `${this.supabaseUrl}/rest/v1/whitelists?wallet_address=eq.${wallet}`;
    if (options.projectId) {
      url += `&project_id=eq.${options.projectId}`;
    }

    await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
      },
      body: JSON.stringify({
        is_active: false,
        kyc_verified: false,
        approval_notes: options.reason || 'Manually rejected by admin',
      }),
    });

    await this.logAudit({
      action: 'manual_reject',
      walletAddress: wallet,
      projectId: options.projectId,
      actorType: 'admin',
      actorId: adminId,
      details: {
        reason: options.reason,
      },
    });
  }

  /**
   * Get pending KYC requests for admin review
   */
  async getPendingReviews(options: {
    limit?: number;
    offset?: number;
    projectId?: string;
  } = {}): Promise<Record<string, any>[]> {
    let url = `${this.supabaseUrl}/rest/v1/kyc_requests?normalized_status=in.(pending,processing,retry)`;
    
    if (options.projectId) {
      url += `&project_id=eq.${options.projectId}`;
    }

    url += `&order=created_at.desc`;
    url += `&limit=${options.limit || 50}`;
    url += `&offset=${options.offset || 0}`;

    const response = await fetch(url, {
      headers: {
        'apikey': this.supabaseKey,
        'Authorization': `Bearer ${this.supabaseKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pending reviews: ${await response.text()}`);
    }

    return response.json();
  }

  // ==========================================================================
  // Data Retention
  // ==========================================================================

  /**
   * Purge old KYC data based on retention policy
   */
  async purgeExpiredData(): Promise<{ purgedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.kycRetentionDays);

    // Delete old KYC requests (keep audit logs)
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/kyc_requests?created_at=lt.${cutoffDate.toISOString()}&normalized_status=neq.approved`,
      {
        method: 'DELETE',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Prefer': 'return=representation',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to purge data: ${await response.text()}`);
    }

    const purged = await response.json();
    const purgedCount = Array.isArray(purged) ? purged.length : 0;

    // Log purge action
    await this.logAudit({
      action: 'data_purged',
      actorType: 'system',
      details: {
        purgedCount,
        cutoffDate: cutoffDate.toISOString(),
        retentionDays: this.kycRetentionDays,
      },
    });

    return { purgedCount };
  }

  // ==========================================================================
  // Database Helpers
  // ==========================================================================

  /**
   * Get existing KYC request for wallet
   */
  private async getExistingKycRequest(
    walletAddress: string
  ): Promise<Record<string, any> | null> {
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/kyc_requests?wallet_address=eq.${walletAddress}&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      console.error('getExistingKycRequest failed:', await response.text());
      return null;
    }

    const data = await response.json();
    return data[0] || null;
  }

  /**
   * Create KYC request record
   */
  private async createKycRequest(data: {
    walletAddress: string;
    userId?: string;
    projectId?: string;
    provider: KycProvider;
    providerSessionId?: string;
    providerApplicantId?: string;
    ipAddress?: string;
  }): Promise<void> {
    const body = {
      wallet_address: data.walletAddress.toLowerCase(),
      user_id: data.userId || null,
      project_id: data.projectId || null,
      provider: data.provider,
      provider_session_id: data.providerSessionId || null,
      provider_applicant_id: data.providerApplicantId || null,
      normalized_status: 'pending',
      ip_address: data.ipAddress || null,
    };

    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/kyc_requests`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create KYC request: ${error}`);
    }
  }

  /**
   * Update KYC request record
   */
  private async updateKycRequest(data: {
    walletAddress: string;
    providerApplicantId: string;
    providerStatus?: string;
    normalizedStatus: NormalizedKycResult['status'];
    rejectionReason?: string;
    countryCode?: string;
    reviewedAt?: Date;
    providerResponse?: Record<string, unknown>;
  }): Promise<void> {
    const body: Record<string, any> = {
      provider_status: data.providerStatus,
      normalized_status: data.normalizedStatus,
      rejection_reason: data.rejectionReason || null,
      country_code: data.countryCode || null,
      reviewed_at: data.reviewedAt?.toISOString() || null,
      provider_response: data.providerResponse || {},
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/kyc_requests?wallet_address=eq.${data.walletAddress}&provider_applicant_id=eq.${data.providerApplicantId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update KYC request: ${error}`);
    }
  }

  /**
   * Log audit entry
   */
  private async logAudit(entry: AuditLogEntry): Promise<void> {
    try {
      const body = {
        action: entry.action,
        wallet_address: entry.walletAddress || null,
        user_id: entry.userId || null,
        kyc_request_id: entry.kycRequestId || null,
        whitelist_id: entry.whitelistId || null,
        project_id: entry.projectId || null,
        actor_type: entry.actorType,
        actor_id: entry.actorId || null,
        details: entry.details || {},
        ip_address: entry.ipAddress || null,
      };

      await fetch(
        `${this.supabaseUrl}/rest/v1/kyc_audit_logs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
          },
          body: JSON.stringify(body),
        }
      );
    } catch (error) {
      // Don't throw on audit log failures, just log
      console.error('Failed to write audit log:', error);
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Mask IP address for privacy (remove last octet)
   */
  private maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
    // IPv6 - mask last segment
    const ipv6Parts = ip.split(':');
    if (ipv6Parts.length > 1) {
      ipv6Parts[ipv6Parts.length - 1] = 'xxxx';
      return ipv6Parts.join(':');
    }
    return ip;
  }

  /**
   * Check if wallet is whitelisted for investment
   */
  async isWalletWhitelisted(
    walletAddress: string,
    projectId: string
  ): Promise<boolean> {
    const response = await fetch(
      `${this.supabaseUrl}/rest/v1/rpc/is_wallet_whitelisted`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
        },
        body: JSON.stringify({
          p_wallet_address: walletAddress.toLowerCase(),
          p_project_id: projectId,
        }),
      }
    );

    if (!response.ok) {
      console.error('isWalletWhitelisted RPC failed:', await response.text());
      return false;
    }

    return await response.json();
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createKycService(config?: {
  supabaseUrl?: string;
  supabaseKey?: string;
  geoIpApiKey?: string;
  kycRetentionDays?: number;
}): KycService {
  return new KycService({
    supabaseUrl: config?.supabaseUrl || process.env.SUPABASE_URL || '',
    supabaseKey: config?.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    geoIpApiKey: config?.geoIpApiKey || process.env.GEOIP_API_KEY,
    kycRetentionDays: config?.kycRetentionDays || parseInt(process.env.KYC_RETENTION_DAYS || '365'),
  });
}

export default KycService;
