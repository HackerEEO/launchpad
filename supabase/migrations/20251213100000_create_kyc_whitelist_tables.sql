-- ============================================================================
-- Migration: Create KYC & Whitelist Tables
-- Description: Phase 6 - KYC & Compliance system for CryptoLaunch
-- Author: CryptoLaunch Development Team
-- Date: 2025-12-13
-- ============================================================================

-- ============================================================================
-- 1. KYC Requests Table
-- Logs all KYC verification requests and provider responses
-- PII is minimal - we store provider reference IDs, not raw documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS kyc_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification
    wallet_address TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Project context (optional - for project-specific KYC)
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Provider information
    provider TEXT NOT NULL CHECK (provider IN ('sumsub', 'synaps', 'onfido', 'civic')),
    provider_session_id TEXT,
    provider_applicant_id TEXT,  -- External ID from provider
    
    -- Status tracking
    provider_status TEXT,  -- Raw status from provider
    normalized_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (normalized_status IN ('pending', 'processing', 'approved', 'rejected', 'expired', 'retry')),
    
    -- Rejection/review details (no PII)
    rejection_reason TEXT,
    review_required BOOLEAN DEFAULT false,
    
    -- Geographic information (for sanctions/restrictions)
    country_code TEXT,  -- ISO 3166-1 alpha-2
    ip_address TEXT,  -- Hashed or last octet masked for privacy
    geo_blocked BOOLEAN DEFAULT false,
    
    -- Provider response metadata (sanitized - no PII)
    provider_response JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ  -- KYC verification expiry
);

-- ============================================================================
-- 2. Whitelists Table
-- Stores verified users eligible for project participation
-- ============================================================================
CREATE TABLE IF NOT EXISTS whitelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification
    wallet_address TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Project association (NULL = platform-wide whitelist)
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Tier and allocation
    tier TEXT NOT NULL DEFAULT 'bronze' 
        CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'guaranteed')),
    max_allocation NUMERIC(78, 0),  -- Maximum investment in wei
    min_allocation NUMERIC(78, 0) DEFAULT 0,  -- Minimum investment in wei
    
    -- KYC verification status
    kyc_verified BOOLEAN DEFAULT false,
    kyc_provider TEXT,
    kyc_request_id UUID REFERENCES kyc_requests(id) ON DELETE SET NULL,
    kyc_timestamp TIMESTAMPTZ,
    kyc_expires_at TIMESTAMPTZ,
    
    -- Manual override
    manually_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approval_notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique wallet per project (or platform-wide)
    CONSTRAINT unique_wallet_project UNIQUE (wallet_address, project_id)
);

-- ============================================================================
-- 3. KYC Audit Logs Table
-- Immutable log of all KYC-related actions for compliance
-- ============================================================================
CREATE TABLE IF NOT EXISTS kyc_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Action context
    action TEXT NOT NULL CHECK (action IN (
        'session_created',
        'webhook_received',
        'status_updated',
        'whitelist_added',
        'whitelist_removed',
        'manual_approve',
        'manual_reject',
        'bulk_upload',
        'data_purged',
        'geo_blocked',
        'sanctions_check'
    )),
    
    -- References
    wallet_address TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    kyc_request_id UUID REFERENCES kyc_requests(id) ON DELETE SET NULL,
    whitelist_id UUID REFERENCES whitelists(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Actor (who performed the action)
    actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'admin', 'webhook', 'user')),
    actor_id UUID,  -- Admin user ID if actor_type = 'admin'
    
    -- Action details (sanitized)
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,  -- Masked for privacy
    
    -- Timestamps (immutable)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. Blocked Countries Table
-- OFAC and restricted jurisdictions
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocked_countries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    country_code TEXT NOT NULL UNIQUE,  -- ISO 3166-1 alpha-2
    country_name TEXT NOT NULL,
    
    -- Block reason
    reason TEXT NOT NULL CHECK (reason IN ('ofac', 'sanctions', 'regulatory', 'internal')),
    notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. Insert Default Blocked Countries (OFAC Sanctions List)
-- ============================================================================
INSERT INTO blocked_countries (country_code, country_name, reason, notes) VALUES
    ('CU', 'Cuba', 'ofac', 'OFAC comprehensive sanctions'),
    ('IR', 'Iran', 'ofac', 'OFAC comprehensive sanctions'),
    ('KP', 'North Korea', 'ofac', 'OFAC comprehensive sanctions'),
    ('SY', 'Syria', 'ofac', 'OFAC comprehensive sanctions'),
    ('RU', 'Russia', 'sanctions', 'EU/US sanctions - partial'),
    ('BY', 'Belarus', 'sanctions', 'EU sanctions'),
    ('MM', 'Myanmar', 'sanctions', 'OFAC targeted sanctions'),
    ('VE', 'Venezuela', 'sanctions', 'OFAC targeted sanctions'),
    ('ZW', 'Zimbabwe', 'sanctions', 'OFAC targeted sanctions')
ON CONFLICT (country_code) DO NOTHING;

-- ============================================================================
-- 6. Indexes for Performance
-- ============================================================================

-- KYC Requests indexes
CREATE INDEX IF NOT EXISTS idx_kyc_requests_wallet ON kyc_requests (wallet_address);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_user ON kyc_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_status ON kyc_requests (normalized_status);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_provider ON kyc_requests (provider, provider_applicant_id);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_created ON kyc_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kyc_requests_review ON kyc_requests (review_required) WHERE review_required = true;

-- Whitelists indexes
CREATE INDEX IF NOT EXISTS idx_whitelists_wallet ON whitelists (wallet_address);
CREATE INDEX IF NOT EXISTS idx_whitelists_project ON whitelists (project_id);
CREATE INDEX IF NOT EXISTS idx_whitelists_wallet_project ON whitelists (wallet_address, project_id);
CREATE INDEX IF NOT EXISTS idx_whitelists_kyc ON whitelists (kyc_verified) WHERE kyc_verified = true;
CREATE INDEX IF NOT EXISTS idx_whitelists_tier ON whitelists (tier);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_kyc_audit_action ON kyc_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_wallet ON kyc_audit_logs (wallet_address);
CREATE INDEX IF NOT EXISTS idx_kyc_audit_created ON kyc_audit_logs (created_at DESC);

-- ============================================================================
-- 7. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitelists ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_countries ENABLE ROW LEVEL SECURITY;

-- KYC Requests policies
CREATE POLICY "Users can view own KYC requests" ON kyc_requests
    FOR SELECT USING (wallet_address = current_setting('app.current_wallet', true));

CREATE POLICY "Service role full access to kyc_requests" ON kyc_requests
    FOR ALL USING (auth.role() = 'service_role');

-- Whitelists policies
CREATE POLICY "Users can view own whitelist entries" ON whitelists
    FOR SELECT USING (wallet_address = current_setting('app.current_wallet', true));

CREATE POLICY "Public can view active whitelists for projects" ON whitelists
    FOR SELECT USING (is_active = true AND kyc_verified = true);

CREATE POLICY "Service role full access to whitelists" ON whitelists
    FOR ALL USING (auth.role() = 'service_role');

-- Audit logs policies (read-only for admins, insert for service)
CREATE POLICY "Admins can view audit logs" ON kyc_audit_logs
    FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert audit logs" ON kyc_audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Blocked countries (public read, admin write)
CREATE POLICY "Anyone can view blocked countries" ON blocked_countries
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage blocked countries" ON blocked_countries
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. Update Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to kyc_requests
DROP TRIGGER IF EXISTS update_kyc_requests_updated_at ON kyc_requests;
CREATE TRIGGER update_kyc_requests_updated_at
    BEFORE UPDATE ON kyc_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to whitelists
DROP TRIGGER IF EXISTS update_whitelists_updated_at ON whitelists;
CREATE TRIGGER update_whitelists_updated_at
    BEFORE UPDATE ON whitelists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to blocked_countries
DROP TRIGGER IF EXISTS update_blocked_countries_updated_at ON blocked_countries;
CREATE TRIGGER update_blocked_countries_updated_at
    BEFORE UPDATE ON blocked_countries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. Helper Functions
-- ============================================================================

-- Function to check if wallet is whitelisted for a project
CREATE OR REPLACE FUNCTION is_wallet_whitelisted(
    p_wallet_address TEXT,
    p_project_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM whitelists
        WHERE wallet_address = LOWER(p_wallet_address)
        AND (project_id = p_project_id OR project_id IS NULL)
        AND kyc_verified = true
        AND is_active = true
        AND (kyc_expires_at IS NULL OR kyc_expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get wallet's allocation for a project
CREATE OR REPLACE FUNCTION get_wallet_allocation(
    p_wallet_address TEXT,
    p_project_id UUID
)
RETURNS TABLE (
    tier TEXT,
    max_allocation NUMERIC,
    min_allocation NUMERIC,
    kyc_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT w.tier, w.max_allocation, w.min_allocation, w.kyc_verified
    FROM whitelists w
    WHERE w.wallet_address = LOWER(p_wallet_address)
    AND (w.project_id = p_project_id OR w.project_id IS NULL)
    AND w.is_active = true
    ORDER BY w.project_id NULLS LAST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if country is blocked
CREATE OR REPLACE FUNCTION is_country_blocked(p_country_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM blocked_countries
        WHERE country_code = UPPER(p_country_code)
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE kyc_requests IS 'Stores KYC verification requests and provider responses. PII is minimal - only reference IDs stored.';
COMMENT ON TABLE whitelists IS 'Stores verified users eligible for project participation with tier-based allocations.';
COMMENT ON TABLE kyc_audit_logs IS 'Immutable audit log for all KYC-related actions. Required for compliance.';
COMMENT ON TABLE blocked_countries IS 'List of blocked/sanctioned countries based on OFAC and regulatory requirements.';

COMMENT ON COLUMN kyc_requests.provider_response IS 'Sanitized provider response. Must NOT contain PII or document images.';
COMMENT ON COLUMN kyc_requests.ip_address IS 'Masked IP address for privacy (e.g., last octet removed).';
COMMENT ON COLUMN whitelists.max_allocation IS 'Maximum investment amount in wei (18 decimals for ETH).';
