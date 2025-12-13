/**
 * KYC Review Admin Page
 * 
 * Admin interface for reviewing KYC requests, managing whitelists,
 * and bulk uploading whitelist entries.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';

// ============================================================================
// Types
// ============================================================================

interface KycRequest {
  id: string;
  wallet_address: string;
  user_id: string | null;
  project_id: string | null;
  provider: string;
  normalized_status: string;
  rejection_reason: string | null;
  country_code: string | null;
  created_at: string;
  updated_at: string;
  whitelists?: WhitelistEntry[];
}

interface WhitelistEntry {
  id: string;
  wallet_address: string;
  project_id: string | null;
  tier: string;
  max_allocation: string | null;
  kyc_verified: boolean;
  manually_approved: boolean;
  is_active: boolean;
  created_at: string;
}

interface KycStats {
  byStatus: Record<string, number>;
  totalWhitelisted: number;
  pendingReviews: number;
}

interface BulkUploadEntry {
  walletAddress: string;
  projectId?: string;
  tier?: string;
  maxAllocation?: string;
}

// ============================================================================
// API Functions
// ============================================================================

const API_BASE = (import.meta as any).env.VITE_SUPABASE_URL;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('supabase.auth.token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

async function getPendingReviews(limit = 50, offset = 0): Promise<{ data: KycRequest[]; total: number }> {
  return fetchWithAuth(
    `${API_BASE}/functions/v1/kyc-admin?action=pending&limit=${limit}&offset=${offset}`
  );
}

async function getKycStats(): Promise<{ stats: KycStats }> {
  return fetchWithAuth(`${API_BASE}/functions/v1/kyc-admin?action=stats`);
}

async function searchWallet(wallet: string): Promise<{
  kycRequests: KycRequest[];
  whitelists: WhitelistEntry[];
  auditLogs: any[];
}> {
  return fetchWithAuth(`${API_BASE}/functions/v1/kyc-admin?action=search&wallet=${wallet}`);
}

async function approveWallet(data: {
  walletAddress: string;
  projectId?: string;
  tier?: string;
  maxAllocation?: string;
  notes?: string;
}) {
  return fetchWithAuth(`${API_BASE}/functions/v1/kyc-admin`, {
    method: 'POST',
    body: JSON.stringify({ action: 'approve', ...data }),
  });
}

async function rejectWallet(data: {
  walletAddress: string;
  projectId?: string;
  reason?: string;
}) {
  return fetchWithAuth(`${API_BASE}/functions/v1/kyc-admin`, {
    method: 'POST',
    body: JSON.stringify({ action: 'reject', ...data }),
  });
}

async function bulkUploadWhitelist(entries: BulkUploadEntry[]) {
  return fetchWithAuth(`${API_BASE}/functions/v1/kyc-admin`, {
    method: 'POST',
    body: JSON.stringify({ action: 'bulk-upload', entries }),
  });
}

// ============================================================================
// Components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
    approved: 'success',
    pending: 'warning',
    processing: 'info',
    rejected: 'error',
    retry: 'warning',
    expired: 'error',
  };

  return <Badge variant={colors[status] || 'info'}>{status}</Badge>;
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    bronze: 'bg-amber-700',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-purple-500',
    guaranteed: 'bg-green-500',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs text-white ${colors[tier] || 'bg-gray-500'}`}>
      {tier}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function KycReview() {
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [pendingReviews, setPendingReviews] = useState<KycRequest[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [stats, setStats] = useState<KycStats | null>(null);
  
  // Search
  const [searchWalletInput, setSearchWalletInput] = useState('');
  const [searchResult, setSearchResult] = useState<{
    kycRequests: KycRequest[];
    whitelists: WhitelistEntry[];
    auditLogs: any[];
  } | null>(null);
  
  // Modal states
  const [approveModal, setApproveModal] = useState<{ open: boolean; wallet?: string }>({ open: false });
  const [rejectModal, setRejectModal] = useState<{ open: boolean; wallet?: string }>({ open: false });
  
  // Form states
  const [approveForm, setApproveForm] = useState({
    tier: 'bronze',
    maxAllocation: '',
    notes: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // ========================================================================
  // Data Fetching
  // ========================================================================

  const loadPendingReviews = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getPendingReviews();
      setPendingReviews(result.data || []);
      setTotalPending(result.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const result = await getKycStats();
      setStats(result.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    loadPendingReviews();
    loadStats();
  }, [loadPendingReviews, loadStats]);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleSearch = async () => {
    if (!searchWalletInput.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await searchWallet(searchWalletInput.trim());
      setSearchResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveModal.wallet) return;
    
    try {
      setLoading(true);
      await approveWallet({
        walletAddress: approveModal.wallet,
        tier: approveForm.tier,
        maxAllocation: approveForm.maxAllocation || undefined,
        notes: approveForm.notes || undefined,
      });
      
      setApproveModal({ open: false });
      setApproveForm({ tier: 'bronze', maxAllocation: '', notes: '' });
      loadPendingReviews();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.wallet) return;
    
    try {
      setLoading(true);
      await rejectWallet({
        walletAddress: rejectModal.wallet,
        reason: rejectReason || undefined,
      });
      
      setRejectModal({ open: false });
      setRejectReason('');
      loadPendingReviews();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    try {
      setLoading(true);
      setBulkUploadResult(null);
      
      // Parse CSV
      const lines = csvInput.trim().split('\n');
      const entries: BulkUploadEntry[] = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        const parts = line.split(',').map(p => p.trim());
        if (parts[0] && parts[0].startsWith('0x')) {
          entries.push({
            walletAddress: parts[0],
            projectId: parts[1] || undefined,
            tier: parts[2] || 'bronze',
            maxAllocation: parts[3] || undefined,
          });
        }
      }
      
      if (entries.length === 0) {
        setError('No valid entries found in CSV');
        return;
      }
      
      const result = await bulkUploadWhitelist(entries);
      setBulkUploadResult({
        success: result.successCount,
        failed: result.failedCount,
        errors: result.errors || [],
      });
      
      if (result.successCount > 0) {
        loadStats();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk upload failed');
    } finally {
      setLoading(false);
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  const tabs = [
    { id: 'pending', label: `Pending Reviews (${totalPending})` },
    { id: 'search', label: 'Search Wallet' },
    { id: 'bulk', label: 'Bulk Upload' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">KYC Management</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Total Whitelisted</div>
            <div className="text-2xl font-bold text-green-600">{stats.totalWhitelisted}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Pending Review</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingReviews}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Approved</div>
            <div className="text-2xl font-bold text-blue-600">{stats.byStatus?.approved || 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-500">Rejected</div>
            <div className="text-2xl font-bold text-red-600">{stats.byStatus?.rejected || 0}</div>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">&times;</button>
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {/* Pending Reviews Tab */}
        {activeTab === 'pending' && (
          <Card className="p-6">
            {loading ? (
              <Loading />
            ) : pendingReviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending reviews</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wallet</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingReviews.map((request) => (
                      <tr key={request.id}>
                        <td className="px-4 py-3 font-mono text-sm">
                          {request.wallet_address.slice(0, 6)}...{request.wallet_address.slice(-4)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={request.normalized_status} />
                        </td>
                        <td className="px-4 py-3 text-sm">{request.provider}</td>
                        <td className="px-4 py-3 text-sm">{request.country_code || '-'}</td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setApproveModal({ open: true, wallet: request.wallet_address })}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setRejectModal({ open: true, wallet: request.wallet_address })}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <Card className="p-6">
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Enter wallet address (0x...)"
                value={searchWalletInput}
                onChange={(e) => setSearchWalletInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
            </div>

            {searchResult && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">KYC Requests</h3>
                  {searchResult.kycRequests.length === 0 ? (
                    <p className="text-gray-500">No KYC requests found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResult.kycRequests.map((req) => (
                        <div key={req.id} className="p-3 bg-gray-50 rounded">
                          <div className="flex justify-between items-center">
                            <StatusBadge status={req.normalized_status} />
                            <span className="text-sm text-gray-500">
                              {new Date(req.created_at).toLocaleString()}
                            </span>
                          </div>
                          {req.rejection_reason && (
                            <p className="text-sm text-red-600 mt-1">{req.rejection_reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Whitelist Entries</h3>
                  {searchResult.whitelists.length === 0 ? (
                    <p className="text-gray-500">No whitelist entries found</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResult.whitelists.map((wl) => (
                        <div key={wl.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <TierBadge tier={wl.tier} />
                            {wl.kyc_verified && <Badge variant="success">Verified</Badge>}
                            {wl.manually_approved && <Badge variant="info">Manual</Badge>}
                            {!wl.is_active && <Badge variant="error">Inactive</Badge>}
                          </div>
                          <div className="text-sm text-gray-500">
                            {wl.max_allocation ? `Max: ${wl.max_allocation}` : 'No limit'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={() => setApproveModal({ open: true, wallet: searchWalletInput })}
                  >
                    Approve This Wallet
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setRejectModal({ open: true, wallet: searchWalletInput })}
                  >
                    Reject This Wallet
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Bulk Upload Tab */}
        {activeTab === 'bulk' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Bulk Whitelist Upload</h3>
            <p className="text-gray-600 mb-4">
              Paste CSV data with format: <code>wallet_address,project_id,tier,max_allocation</code>
            </p>
            
            <textarea
              className="w-full h-48 p-3 border rounded font-mono text-sm"
              placeholder="0x1234...abcd,project-uuid,gold,1000000000000000000&#10;0x5678...efgh,,bronze,&#10;..."
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
            />

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                {csvInput.trim().split('\n').filter(l => l.trim()).length} entries
              </div>
              <Button onClick={handleBulkUpload} disabled={loading || !csvInput.trim()}>
                Upload Whitelist
              </Button>
            </div>

            {bulkUploadResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <div className="flex gap-4 mb-2">
                  <span className="text-green-600">✓ {bulkUploadResult.success} successful</span>
                  <span className="text-red-600">✗ {bulkUploadResult.failed} failed</span>
                </div>
                {bulkUploadResult.errors.length > 0 && (
                  <div className="text-sm text-red-600">
                    {bulkUploadResult.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={approveModal.open}
        onClose={() => setApproveModal({ open: false })}
        title="Approve Wallet"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Wallet Address</label>
            <code className="block p-2 bg-gray-100 rounded">{approveModal.wallet}</code>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tier</label>
            <select
              className="w-full p-2 border rounded"
              value={approveForm.tier}
              onChange={(e) => setApproveForm({ ...approveForm, tier: e.target.value })}
            >
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="guaranteed">Guaranteed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Max Allocation (wei)</label>
            <Input
              type="text"
              placeholder="Leave empty for no limit"
              value={approveForm.maxAllocation}
              onChange={(e) => setApproveForm({ ...approveForm, maxAllocation: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Input
              type="text"
              placeholder="Optional notes"
              value={approveForm.notes}
              onChange={(e) => setApproveForm({ ...approveForm, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setApproveModal({ open: false })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApprove} disabled={loading}>
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false })}
        title="Reject Wallet"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Wallet Address</label>
            <code className="block p-2 bg-gray-100 rounded">{rejectModal.wallet}</code>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Rejection Reason</label>
            <Input
              type="text"
              placeholder="Enter reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setRejectModal({ open: false })}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleReject} disabled={loading}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
