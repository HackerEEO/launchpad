# KYC & Compliance System

CryptoLaunch Phase 6 implementation for Know Your Customer (KYC) verification and compliance.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Provider Integration](#provider-integration)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Admin Interface](#admin-interface)
- [Geographic Restrictions](#geographic-restrictions)
- [PII Handling & Security](#pii-handling--security)
- [Data Retention Policy](#data-retention-policy)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)

---

## Overview

The KYC system provides:

- **Identity Verification**: Integration with Sumsub for document verification
- **Whitelist Management**: Tier-based access control for IDO participation
- **Geographic Compliance**: OFAC sanctions and country blocking
- **Admin Tools**: Manual review, approval, and bulk upload capabilities
- **Audit Logging**: Immutable logs for compliance requirements

### Key Features

| Feature | Description |
|---------|-------------|
| Multi-provider | Primary Sumsub + fallback support |
| Tiered Access | Bronze, Silver, Gold, Platinum, Guaranteed |
| Allocation Limits | Per-wallet investment caps |
| Geo-blocking | OFAC + custom country restrictions |
| Webhook Processing | Real-time status updates from provider |
| PII Protection | Minimal data storage, encrypted fields |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│ Edge Functions   │────▶│   Supabase DB   │
│   (React)       │     │ (Deno Runtime)   │     │   (PostgreSQL)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Sumsub API      │
                        │  (KYC Provider)  │
                        └──────────────────┘
```

### Flow Diagram

```
User                    Frontend              Edge Functions           Sumsub             Database
  │                        │                        │                    │                   │
  │ Click "Verify KYC"     │                        │                    │                   │
  │───────────────────────▶│                        │                    │                   │
  │                        │ POST /kyc-create-session                    │                   │
  │                        │───────────────────────▶│                    │                   │
  │                        │                        │ Check geo location │                   │
  │                        │                        │───────────────────▶│                   │
  │                        │                        │ Create applicant   │                   │
  │                        │                        │───────────────────▶│                   │
  │                        │                        │                    │                   │
  │                        │                        │ Store kyc_request  │                   │
  │                        │                        │──────────────────────────────────────▶│
  │                        │◀───────────────────────│                    │                   │
  │◀───────────────────────│ Return session URL     │                    │                   │
  │                        │                        │                    │                   │
  │ Complete verification ─────────────────────────────────────────────▶│                   │
  │                        │                        │                    │                   │
  │                        │                        │◀─── Webhook ───────│                   │
  │                        │                        │ Verify signature   │                   │
  │                        │                        │ Update kyc_request │                   │
  │                        │                        │──────────────────────────────────────▶│
  │                        │                        │ Create whitelist   │                   │
  │                        │                        │──────────────────────────────────────▶│
  │                        │                        │                    │                   │
```

---

## Provider Integration

### Sumsub (Primary)

Sumsub is the primary KYC provider. It offers:

- Document verification (passport, ID card, driver's license)
- Facial recognition and liveness check
- Address verification
- AML/PEP screening
- 220+ countries supported

**Pricing**: $0.50 - $5 per verification (volume-based)

#### Configuration

```bash
# .env
KYC_PROVIDER=sumsub
KYC_PROVIDER_API_KEY=your_sumsub_app_token
KYC_PROVIDER_SECRET=your_sumsub_secret_key
SUMSUB_BASE_URL=https://api.sumsub.com
SUMSUB_LEVEL_NAME=basic-kyc-level
KYC_CALLBACK_URL=https://your-app.supabase.co/functions/v1/kyc-webhook
```

#### Webhook Setup

1. Go to Sumsub Dashboard → Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/kyc-webhook`
3. Select events:
   - `applicantCreated`
   - `applicantPending`
   - `applicantReviewed`
   - `applicantOnHold`
4. Copy the webhook secret and add to `.env` as `KYC_PROVIDER_SECRET`

### Alternative Providers

| Provider | Status | Notes |
|----------|--------|-------|
| Synaps | Planned | Web3 native, NFT-based verification |
| Onfido | Planned | Enterprise grade |
| Civic | Planned | Blockchain identity |

---

## Database Schema

### Tables

#### `kyc_requests`
Logs all KYC verification requests.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| wallet_address | TEXT | User's wallet address |
| user_id | UUID | Optional user reference |
| project_id | UUID | Optional project reference |
| provider | TEXT | KYC provider (sumsub, synaps, etc.) |
| provider_session_id | TEXT | Provider's session token |
| provider_applicant_id | TEXT | Provider's applicant ID |
| normalized_status | TEXT | pending, processing, approved, rejected, expired, retry |
| rejection_reason | TEXT | Reason for rejection (if applicable) |
| country_code | TEXT | ISO 3166-1 alpha-2 |
| geo_blocked | BOOLEAN | Whether blocked by geography |
| provider_response | JSONB | Sanitized provider response |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| reviewed_at | TIMESTAMPTZ | When review was completed |

#### `whitelists`
Stores verified users eligible for project participation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| wallet_address | TEXT | User's wallet address |
| project_id | UUID | Null for platform-wide whitelist |
| tier | TEXT | bronze, silver, gold, platinum, guaranteed |
| max_allocation | NUMERIC | Maximum investment in wei |
| min_allocation | NUMERIC | Minimum investment in wei |
| kyc_verified | BOOLEAN | Whether KYC is verified |
| kyc_provider | TEXT | Which provider verified |
| kyc_expires_at | TIMESTAMPTZ | When KYC expires |
| manually_approved | BOOLEAN | Admin override |
| approved_by | UUID | Admin who approved |
| is_active | BOOLEAN | Whether entry is active |

#### `kyc_audit_logs`
Immutable audit log for compliance.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| action | TEXT | session_created, webhook_received, manual_approve, etc. |
| wallet_address | TEXT | Associated wallet |
| actor_type | TEXT | system, admin, webhook, user |
| actor_id | UUID | Admin ID if actor_type is admin |
| details | JSONB | Action details |
| created_at | TIMESTAMPTZ | Timestamp (immutable) |

#### `blocked_countries`
List of blocked/sanctioned countries.

| Column | Type | Description |
|--------|------|-------------|
| country_code | TEXT | ISO 3166-1 alpha-2 |
| country_name | TEXT | Full country name |
| reason | TEXT | ofac, sanctions, regulatory, internal |
| is_active | BOOLEAN | Whether block is active |

---

## API Reference

### Create KYC Session

**Endpoint**: `POST /functions/v1/kyc-create-session`

**Request**:
```json
{
  "walletAddress": "0x1234...abcd",
  "userId": "optional-uuid",
  "projectId": "optional-project-uuid"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "sessionUrl": "https://websdk.sumsub.com/?accessToken=...",
  "accessToken": "...",
  "applicantId": "...",
  "expiresAt": "2025-12-14T10:00:00Z"
}
```

**Response (Geo Blocked)**:
```json
{
  "success": false,
  "error": "KYC verification is not available in your region",
  "geoBlocked": true,
  "blockedCountry": "IR"
}
```

### Check KYC Status

**Endpoint**: `GET /functions/v1/kyc-status?wallet=0x...&projectId=...`

**Response**:
```json
{
  "success": true,
  "walletAddress": "0x1234...abcd",
  "kycStatus": "approved",
  "kycProvider": "sumsub",
  "kycVerified": true,
  "kycExpiresAt": "2026-12-13T10:00:00Z",
  "whitelisted": true,
  "whitelistTier": "gold",
  "maxAllocation": "10000000000000000000",
  "geoBlocked": false
}
```

### Webhook Handler

**Endpoint**: `POST /functions/v1/kyc-webhook`

**Headers**:
- `x-payload-digest`: HMAC-SHA256 signature

**Payload**: Sumsub webhook format (see provider docs)

### Admin Endpoints

**Endpoint**: `GET /functions/v1/kyc-admin?action=pending`

Returns pending KYC reviews.

**Endpoint**: `POST /functions/v1/kyc-admin`

Actions:
- `approve`: Manually approve a wallet
- `reject`: Manually reject a wallet
- `bulk-upload`: Upload whitelist CSV

---

## Admin Interface

Access the admin KYC review page at `/admin/kyc-review`.

### Features

1. **Pending Reviews**: List of wallets awaiting manual review
2. **Search**: Look up any wallet's KYC and whitelist status
3. **Manual Approval**: Approve wallets with tier and allocation settings
4. **Bulk Upload**: Import whitelist entries from CSV

### CSV Format

```csv
wallet_address,project_id,tier,max_allocation
0x1234...abcd,project-uuid,gold,10000000000000000000
0x5678...efgh,,bronze,
```

---

## Geographic Restrictions

### OFAC Sanctioned Countries

The following countries are blocked by default:

| Country | Code | Reason |
|---------|------|--------|
| Cuba | CU | OFAC comprehensive |
| Iran | IR | OFAC comprehensive |
| North Korea | KP | OFAC comprehensive |
| Syria | SY | OFAC comprehensive |
| Russia | RU | EU/US sanctions |
| Belarus | BY | EU sanctions |
| Myanmar | MM | OFAC targeted |
| Venezuela | VE | OFAC targeted |
| Zimbabwe | ZW | OFAC targeted |

### IP Geolocation

Uses ipinfo.io for IP-to-country resolution.

```bash
# Optional: Add API key for higher rate limits
GEOIP_API_KEY=your_ipinfo_token
```

### Customizing Blocked Countries

```sql
-- Add a country
INSERT INTO blocked_countries (country_code, country_name, reason)
VALUES ('XX', 'Country Name', 'regulatory');

-- Remove a country
UPDATE blocked_countries SET is_active = false WHERE country_code = 'XX';
```

---

## PII Handling & Security

### Data Minimization

We follow the principle of data minimization:

| Data Type | Stored? | Notes |
|-----------|---------|-------|
| Wallet Address | ✅ Yes | Required for identification |
| Document Images | ❌ No | Never stored; provider reference only |
| Full Name | ❌ No | Not stored |
| Date of Birth | ❌ No | Not stored |
| Address | ❌ No | Not stored |
| Provider Reference ID | ✅ Yes | For status lookups |
| Country Code | ✅ Yes | For geo compliance |
| IP Address | ✅ Masked | Last octet removed |

### Encryption

- All sensitive fields use Supabase's at-rest encryption
- Provider responses are sanitized before storage
- IP addresses are masked (e.g., `192.168.1.xxx`)

### Access Control

- KYC data is protected by Row Level Security (RLS)
- Only service role can access full records
- Users can only see their own KYC status
- Admin access requires `is_admin` flag on user record

---

## Data Retention Policy

### Default Retention

| Data Type | Retention | Action |
|-----------|-----------|--------|
| Approved KYC | Indefinite | Keep for compliance |
| Rejected KYC | 365 days | Purge after retention |
| Pending KYC | 30 days | Expire and purge |
| Audit Logs | 7 years | Required for compliance |
| Whitelist Entries | Project lifetime | Clean up with project |

### Configuration

```bash
# .env
KYC_RETENTION_DAYS=365
```

### Manual Purge

```sql
-- Purge old rejected/expired KYC requests
SELECT * FROM kyc_service.purgeExpiredData();
```

---

## Deployment Guide

### 1. Run Database Migration

```bash
supabase db push
# Or manually:
psql $DATABASE_URL -f supabase/migrations/20251213100000_create_kyc_whitelist_tables.sql
```

### 2. Deploy Edge Functions

```bash
supabase functions deploy kyc-create-session
supabase functions deploy kyc-webhook
supabase functions deploy kyc-status
supabase functions deploy kyc-admin
```

### 3. Set Environment Secrets

```bash
supabase secrets set KYC_PROVIDER=sumsub
supabase secrets set KYC_PROVIDER_API_KEY=your_key
supabase secrets set KYC_PROVIDER_SECRET=your_secret
supabase secrets set GEOIP_API_KEY=optional
```

### 4. Configure Webhook in Sumsub

1. Log in to Sumsub Dashboard
2. Go to Developers → Webhooks
3. Add URL: `https://your-project.supabase.co/functions/v1/kyc-webhook`
4. Enable relevant events
5. Copy webhook secret

### 5. Test Integration

```bash
# Run demo script
node scripts/demo-kyc.js
```

---

## Troubleshooting

### Common Issues

#### "KYC session creation failed"

1. Check Sumsub API credentials
2. Verify `KYC_PROVIDER_API_KEY` and `KYC_PROVIDER_SECRET` are set
3. Check Sumsub dashboard for API status

#### "Invalid webhook signature"

1. Ensure `KYC_PROVIDER_SECRET` matches Sumsub webhook secret
2. Check that webhook URL is correct
3. Verify no proxy is modifying the request body

#### "Wallet not whitelisted"

1. Check `whitelists` table for the wallet
2. Verify `kyc_verified` is true
3. Check `is_active` is true
4. Verify `kyc_expires_at` hasn't passed

#### "Geographic restriction"

1. Check `blocked_countries` table
2. Verify IP geolocation is working
3. Check if VPN is being used

### Logs

View edge function logs:

```bash
supabase functions logs kyc-webhook --follow
```

### Support

For Sumsub integration issues:
- Sumsub Docs: https://docs.sumsub.com/
- API Reference: https://docs.sumsub.com/reference

---

## Legal Considerations

### Required Disclosures

Ensure your application includes:

1. **Privacy Policy**: Describe KYC data collection and usage
2. **Terms of Service**: Include KYC requirements
3. **Cookie Policy**: If using session cookies

### Compliance Checklist

- [ ] Privacy policy updated with KYC data handling
- [ ] Terms of service include KYC requirements
- [ ] GDPR compliance (if serving EU users)
- [ ] Data processing agreements with providers
- [ ] Audit log retention meets regulatory requirements

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-13 | Initial Phase 6 implementation |

---

*Document maintained by CryptoLaunch Development Team*
