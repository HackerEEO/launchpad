/**
 * Sumsub KYC Provider Adapter
 * 
 * Provides normalized interface for Sumsub KYC verification.
 * Sumsub is the primary KYC provider for CryptoLaunch.
 * 
 * @see https://docs.sumsub.com/
 */

import { createHmac } from 'node:crypto';

// ============================================================================
// Types
// ============================================================================

export interface NormalizedKycResult {
  externalId: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'expired' | 'retry';
  provider: 'sumsub' | 'synaps' | 'onfido' | 'civic';
  proof: {
    applicantId: string;
    reviewId?: string;
    verificationLevel?: string;
  };
  reviewedAt?: Date;
  rejectionReason?: string;
  countryCode?: string;
}

export interface SumsubConfig {
  appToken: string;
  secretKey: string;
  baseUrl?: string;
  levelName?: string;
  ttlInSecs?: number;
}

export interface SumsubApplicantResponse {
  id: string;
  createdAt: string;
  clientId: string;
  inspectionId: string;
  externalUserId: string;
  info?: {
    country?: string;
    firstName?: string;
    lastName?: string;
  };
  review?: {
    reviewId: string;
    attemptId: string;
    attemptCnt: number;
    levelName: string;
    createDate: string;
    reviewDate?: string;
    reviewResult?: {
      reviewAnswer: 'GREEN' | 'RED' | 'YELLOW';
      rejectLabels?: string[];
      reviewRejectType?: string;
    };
    reviewStatus: 'init' | 'pending' | 'prechecked' | 'queued' | 'completed' | 'onHold';
  };
}

export interface SumsubWebhookPayload {
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

export interface CreateSessionResult {
  sessionUrl: string;
  accessToken: string;
  applicantId: string;
  expiresAt: Date;
}

// ============================================================================
// Sumsub Adapter Class
// ============================================================================

export class SumsubAdapter {
  private config: Required<SumsubConfig>;

  constructor(config: SumsubConfig) {
    this.config = {
      appToken: config.appToken,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl || 'https://api.sumsub.com',
      levelName: config.levelName || 'basic-kyc-level',
      ttlInSecs: config.ttlInSecs || 3600,
    };
  }

  // ==========================================================================
  // Signature Generation
  // ==========================================================================

  /**
   * Generate HMAC signature for Sumsub API requests
   */
  private generateSignature(
    ts: number,
    httpMethod: string,
    path: string,
    body?: string
  ): string {
    const data = ts + httpMethod.toUpperCase() + path + (body || '');
    return createHmac('sha256', this.config.secretKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate request headers with authentication
   */
  private getHeaders(method: string, path: string, body?: string): HeadersInit {
    const ts = Math.floor(Date.now() / 1000);
    const signature = this.generateSignature(ts, method, path, body);

    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-App-Token': this.config.appToken,
      'X-App-Access-Ts': ts.toString(),
      'X-App-Access-Sig': signature,
    };
  }

  // ==========================================================================
  // API Methods
  // ==========================================================================

  /**
   * Create a new KYC session for a user
   */
  async createSession(
    externalUserId: string,
    levelName?: string
  ): Promise<CreateSessionResult> {
    const level = levelName || this.config.levelName;
    
    // Step 1: Create or get applicant
    const applicant = await this.createApplicant(externalUserId, level);
    
    // Step 2: Generate access token for SDK
    const accessToken = await this.generateAccessToken(externalUserId, level);
    
    // Build session URL for WebSDK
    const sessionUrl = `https://websdk.sumsub.com/?accessToken=${accessToken}`;
    
    return {
      sessionUrl,
      accessToken,
      applicantId: applicant.id,
      expiresAt: new Date(Date.now() + this.config.ttlInSecs * 1000),
    };
  }

  /**
   * Create applicant in Sumsub
   */
  private async createApplicant(
    externalUserId: string,
    levelName: string
  ): Promise<SumsubApplicantResponse> {
    const path = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`;
    const body = JSON.stringify({ externalUserId });
    
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders('POST', path, body),
      body,
    });

    if (!response.ok) {
      // Check if applicant already exists
      if (response.status === 409) {
        return this.getApplicantByExternalId(externalUserId);
      }
      const error = await response.text();
      throw new Error(`Sumsub createApplicant failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get applicant by external user ID
   */
  async getApplicantByExternalId(externalUserId: string): Promise<SumsubApplicantResponse> {
    const path = `/resources/applicants/-/externalUserId/${encodeURIComponent(externalUserId)}`;
    
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method: 'GET',
      headers: this.getHeaders('GET', path),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sumsub getApplicant failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get applicant by Sumsub applicant ID
   */
  async getApplicantById(applicantId: string): Promise<SumsubApplicantResponse> {
    const path = `/resources/applicants/${applicantId}`;
    
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method: 'GET',
      headers: this.getHeaders('GET', path),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sumsub getApplicantById failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Generate access token for WebSDK
   */
  private async generateAccessToken(
    externalUserId: string,
    levelName: string
  ): Promise<string> {
    const path = `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}&levelName=${encodeURIComponent(levelName)}&ttlInSecs=${this.config.ttlInSecs}`;
    
    const response = await fetch(`${this.config.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders('POST', path),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sumsub generateAccessToken failed: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.token;
  }

  /**
   * Get applicant verification status
   */
  async getApplicantStatus(applicantId: string): Promise<NormalizedKycResult> {
    const applicant = await this.getApplicantById(applicantId);
    return this.normalizeApplicantResponse(applicant);
  }

  // ==========================================================================
  // Webhook Handling
  // ==========================================================================

  /**
   * Verify webhook signature from Sumsub
   * 
   * @see https://docs.sumsub.com/reference/webhooks
   */
  verifyWebhookSignature(
    payload: string,
    signature: string | null,
    secretKey?: string
  ): boolean {
    if (!signature) {
      return false;
    }

    const secret = secretKey || this.config.secretKey;
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Parse and normalize webhook payload
   */
  parseWebhookPayload(payload: string): SumsubWebhookPayload {
    try {
      return JSON.parse(payload);
    } catch {
      throw new Error('Invalid webhook payload JSON');
    }
  }

  /**
   * Normalize webhook payload to common schema
   */
  normalizeWebhookPayload(payload: SumsubWebhookPayload): NormalizedKycResult {
    const status = this.mapReviewStatus(
      payload.reviewStatus,
      payload.reviewResult?.reviewAnswer
    );

    const rejectionLabels = payload.reviewResult?.rejectLabels || [];
    const rejectionReason = rejectionLabels.length > 0
      ? rejectionLabels.join(', ')
      : payload.reviewResult?.moderationComment;

    return {
      externalId: payload.externalUserId,
      status,
      provider: 'sumsub',
      proof: {
        applicantId: payload.applicantId,
        reviewId: payload.inspectionId,
        verificationLevel: payload.levelName,
      },
      reviewedAt: new Date(payload.createdAtMs),
      rejectionReason,
    };
  }

  /**
   * Normalize applicant API response to common schema
   */
  private normalizeApplicantResponse(
    applicant: SumsubApplicantResponse
  ): NormalizedKycResult {
    const review = applicant.review;
    const status = this.mapReviewStatus(
      review?.reviewStatus,
      review?.reviewResult?.reviewAnswer
    );

    const rejectionLabels = review?.reviewResult?.rejectLabels || [];
    const rejectionReason = rejectionLabels.length > 0
      ? rejectionLabels.join(', ')
      : undefined;

    return {
      externalId: applicant.externalUserId,
      status,
      provider: 'sumsub',
      proof: {
        applicantId: applicant.id,
        reviewId: review?.reviewId,
        verificationLevel: review?.levelName,
      },
      reviewedAt: review?.reviewDate ? new Date(review.reviewDate) : undefined,
      rejectionReason,
      countryCode: applicant.info?.country,
    };
  }

  /**
   * Map Sumsub status to normalized status
   */
  private mapReviewStatus(
    reviewStatus?: string,
    reviewAnswer?: 'GREEN' | 'RED' | 'YELLOW'
  ): NormalizedKycResult['status'] {
    // If we have a review answer, use it
    if (reviewAnswer) {
      switch (reviewAnswer) {
        case 'GREEN':
          return 'approved';
        case 'RED':
          return 'rejected';
        case 'YELLOW':
          return 'retry'; // Needs additional documents/review
      }
    }

    // Otherwise, use review status
    switch (reviewStatus) {
      case 'completed':
        return 'approved'; // Fallback if no reviewAnswer
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

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if webhook type indicates a completed review
   */
  static isReviewCompletedWebhook(type: string): boolean {
    return [
      'applicantReviewed',
      'applicantCreated',
      'applicantPending',
      'applicantOnHold',
    ].includes(type);
  }

  /**
   * Sanitize applicant data for storage (remove PII)
   */
  static sanitizeForStorage(applicant: SumsubApplicantResponse): Record<string, unknown> {
    return {
      id: applicant.id,
      createdAt: applicant.createdAt,
      externalUserId: applicant.externalUserId,
      review: applicant.review ? {
        reviewId: applicant.review.reviewId,
        levelName: applicant.review.levelName,
        reviewStatus: applicant.review.reviewStatus,
        reviewResult: applicant.review.reviewResult ? {
          reviewAnswer: applicant.review.reviewResult.reviewAnswer,
          rejectLabels: applicant.review.reviewResult.rejectLabels,
          reviewRejectType: applicant.review.reviewResult.reviewRejectType,
        } : undefined,
        reviewDate: applicant.review.reviewDate,
      } : undefined,
      // Explicitly exclude: info.firstName, info.lastName, documents, etc.
    };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createSumsubAdapter(config?: Partial<SumsubConfig>): SumsubAdapter {
  const appToken = config?.appToken || process.env.KYC_PROVIDER_API_KEY || '';
  const secretKey = config?.secretKey || process.env.KYC_PROVIDER_SECRET || '';

  if (!appToken || !secretKey) {
    throw new Error('Sumsub credentials not configured. Set KYC_PROVIDER_API_KEY and KYC_PROVIDER_SECRET.');
  }

  return new SumsubAdapter({
    appToken,
    secretKey,
    baseUrl: config?.baseUrl || process.env.SUMSUB_BASE_URL,
    levelName: config?.levelName || process.env.SUMSUB_LEVEL_NAME,
    ttlInSecs: config?.ttlInSecs,
  });
}

export default SumsubAdapter;
