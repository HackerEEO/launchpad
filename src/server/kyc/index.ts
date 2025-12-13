/**
 * KYC Module Index
 * 
 * Exports all KYC-related adapters and services
 */

// Adapters
export { 
  SumsubAdapter, 
  createSumsubAdapter,
  type NormalizedKycResult,
  type SumsubConfig,
  type SumsubWebhookPayload,
  type CreateSessionResult,
} from './adapters/sumsub';

// Service
export { 
  KycService, 
  createKycService,
  type KycProvider,
  type KycSessionRequest,
  type KycSessionResponse,
  type KycStatusResponse,
  type WhitelistEntry,
  type GeoCheckResult,
  type AuditLogEntry,
} from './service';
