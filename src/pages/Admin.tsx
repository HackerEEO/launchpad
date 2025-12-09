import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { useProjects } from '@/hooks/useProjects';
import { projectsService } from '@/services/projects.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { StatCard, StatIcons } from '@/components/ui/StatCard';
import { EmptyState, EmptyStateIcons } from '@/components/ui/EmptyState';
import { StatCardSkeleton } from '@/components/ui/LoadingState';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import toast from 'react-hot-toast';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type TabType = 'overview' | 'projects' | 'settings';
type StatusFilter = 'all' | 'upcoming' | 'live' | 'ended';

export const Admin = () => {
  const { isAdmin } = useAppStore();
  const navigate = useNavigate();
  const { projects, loading, refresh } = useProjects();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    token_name: '',
    token_symbol: '',
    total_supply: '',
    token_price: '',
    hard_cap: '',
    soft_cap: '',
    sale_start: '',
    sale_end: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
    logo_url: '',
    banner_url: '',
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalRaised = projects.reduce((sum, p) => sum + (p.raised_amount || 0), 0);
    const totalHardCap = projects.reduce((sum, p) => sum + p.hard_cap, 0);
    const liveProjects = projects.filter(p => p.status === 'live').length;
    const upcomingProjects = projects.filter(p => p.status === 'upcoming').length;
    const completedProjects = projects.filter(p => p.status === 'ended').length;
    const avgProgress = totalHardCap > 0 ? (totalRaised / totalHardCap) * 100 : 0;
    
    return {
      totalProjects: projects.length,
      totalRaised,
      liveProjects,
      upcomingProjects,
      completedProjects,
      avgProgress,
    };
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.token_symbol.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [projects, statusFilter, searchQuery]);

  // Access denied state
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-md w-full"
        >
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-red-500/20 via-transparent to-orange-500/20 blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-slate-800/80 backdrop-blur-xl p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/20"
            >
              <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </motion.div>
            <h2 className="mb-3 text-2xl font-bold text-white">Access Denied</h2>
            <p className="mb-6 text-slate-400">
              You don&apos;t have permission to access the admin panel. Please contact an administrator.
            </p>
            <Button onClick={() => navigate('/')} variant="secondary">
              Go Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      await projectsService.create({
        ...formData,
        total_supply: Number(formData.total_supply),
        token_price: Number(formData.token_price),
        hard_cap: Number(formData.hard_cap),
        soft_cap: Number(formData.soft_cap),
        sale_start: new Date(formData.sale_start).toISOString(),
        sale_end: new Date(formData.sale_end).toISOString(),
        status: 'upcoming',
        token_address: null,
        vesting_schedule: {
          tge_percent: 20,
          cliff_months: 3,
          vesting_months: 12,
        },
      });

      toast.success('Project created successfully');
      setShowCreateModal(false);
      resetForm();
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;

    try {
      await projectsService.delete(id);
      toast.success('Project deleted successfully');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      token_name: '',
      token_symbol: '',
      total_supply: '',
      token_price: '',
      hard_cap: '',
      soft_cap: '',
      sale_start: '',
      sale_end: '',
      website: '',
      twitter: '',
      telegram: '',
      discord: '',
      logo_url: '',
      banner_url: '',
    });
  };

  const tabs: { id: TabType; label: string; icon: JSX.Element }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-700" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-700" />
        </div>
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-12"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">
            Admin <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Dashboard</span>
          </h1>
          <p className="mt-1 text-slate-400">Manage projects, analytics, and platform settings</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Project
        </Button>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex gap-2 rounded-xl border border-slate-700/50 bg-slate-800/30 p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Analytics Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Projects"
                value={analytics.totalProjects}
                icon={StatIcons.Rocket}
                variant="gradient"
              />
              <StatCard
                title="Total Raised"
                value={formatCurrency(analytics.totalRaised)}
                icon={StatIcons.Wallet}
                trend={analytics.totalRaised > 0 ? { value: 23.5, isPositive: true } : undefined}
              />
              <StatCard
                title="Live Projects"
                value={analytics.liveProjects}
                icon={StatIcons.Chart}
                subtitle={`${analytics.upcomingProjects} upcoming`}
              />
              <StatCard
                title="Avg. Progress"
                value={`${analytics.avgProgress.toFixed(1)}%`}
                icon={StatIcons.TrendingUp}
              />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Recent Activity */}
              <div className="lg:col-span-2 rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Recent Projects</h3>
                {projects.slice(0, 5).length === 0 ? (
                  <p className="text-slate-500">No projects yet</p>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between rounded-xl bg-slate-700/30 p-3 transition-colors hover:bg-slate-700/50"
                      >
                        <div className="flex items-center gap-3">
                          {project.logo_url ? (
                            <img src={project.logo_url} alt={project.name} className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20 text-primary-400 font-bold">
                              {project.name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{project.name}</p>
                            <p className="text-xs text-slate-500">{project.token_symbol}</p>
                          </div>
                        </div>
                        <Badge variant={project.status === 'live' ? 'success' : project.status === 'upcoming' ? 'info' : 'default'}>
                          {project.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Breakdown */}
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Status Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Live', count: analytics.liveProjects, color: 'bg-green-500' },
                    { label: 'Upcoming', count: analytics.upcomingProjects, color: 'bg-blue-500' },
                    { label: 'Ended', count: analytics.completedProjects, color: 'bg-slate-500' },
                  ].map((status) => (
                    <div key={status.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-400">{status.label}</span>
                        <span className="font-medium text-white">{status.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${analytics.totalProjects > 0 ? (status.count / analytics.totalProjects) * 100 : 0}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={`h-full ${status.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'projects' && (
          <motion.div
            key="projects"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-2">
                {(['all', 'upcoming', 'live', 'ended'] as StatusFilter[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      statusFilter === status
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 py-2 pl-10 pr-4 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 md:w-64"
                />
              </div>
            </div>

            {/* Projects Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/30">
              {filteredProjects.length === 0 ? (
                <EmptyState
                  icon={EmptyStateIcons.NoProjects}
                  title="No Projects Found"
                  description={searchQuery ? "No projects match your search criteria." : "No projects have been created yet."}
                  action={{
                    label: 'Create First Project',
                    onClick: () => setShowCreateModal(true),
                  }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-slate-800/50">
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Project</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Raised</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Target</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Progress</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Created</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {filteredProjects.map((project, index) => {
                        const progress = (project.raised_amount / project.hard_cap) * 100;
                        
                        return (
                          <motion.tr
                            key={project.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="group transition-colors hover:bg-slate-700/20"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {project.logo_url ? (
                                  <img src={project.logo_url} alt={project.name} className="h-10 w-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 font-bold text-white">
                                    {project.name[0]}
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-white">{project.name}</p>
                                  <p className="text-sm text-slate-500">{project.token_symbol}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={project.status === 'live' ? 'success' : project.status === 'upcoming' ? 'info' : 'default'}>
                                {project.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-semibold text-white">
                              {formatCurrency(project.raised_amount)}
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                              {formatCurrency(project.hard_cap)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-700">
                                  <div
                                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm text-slate-400">{progress.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {formatDateTime(project.created_at)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="secondary" onClick={() => navigate(`/projects/${project.id}`)}>
                                  View
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-8"
          >
            <h3 className="mb-6 text-xl font-semibold text-white">Platform Settings</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input label="Platform Name" value="CryptoLaunch" disabled />
                <Input label="Network" value="Sepolia Testnet" disabled />
                <Input label="Contract Address" value="Coming Soon" disabled />
                <Input label="Treasury Wallet" value="Coming Soon" disabled />
              </div>
              
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-yellow-400">Settings Coming Soon</p>
                    <p className="text-sm text-yellow-400/70">Platform settings will be available in a future update.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        maxWidth="max-w-4xl"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter project name"
          />
          <Input
            label="Token Symbol"
            value={formData.token_symbol}
            onChange={(e) => setFormData({ ...formData, token_symbol: e.target.value.toUpperCase() })}
            placeholder="e.g., BTC"
          />
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Project description"
              rows={3}
              className="w-full rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <Input
            label="Token Name"
            value={formData.token_name}
            onChange={(e) => setFormData({ ...formData, token_name: e.target.value })}
            placeholder="Token name"
          />
          <Input
            label="Total Supply"
            type="number"
            value={formData.total_supply}
            onChange={(e) => setFormData({ ...formData, total_supply: e.target.value })}
            placeholder="1000000"
          />
          <Input
            label="Token Price (USD)"
            type="number"
            value={formData.token_price}
            onChange={(e) => setFormData({ ...formData, token_price: e.target.value })}
            placeholder="0.01"
          />
          <Input
            label="Hard Cap (USD)"
            type="number"
            value={formData.hard_cap}
            onChange={(e) => setFormData({ ...formData, hard_cap: e.target.value })}
            placeholder="500000"
          />
          <Input
            label="Soft Cap (USD)"
            type="number"
            value={formData.soft_cap}
            onChange={(e) => setFormData({ ...formData, soft_cap: e.target.value })}
            placeholder="250000"
          />
          <Input
            label="Sale Start"
            type="datetime-local"
            value={formData.sale_start}
            onChange={(e) => setFormData({ ...formData, sale_start: e.target.value })}
          />
          <Input
            label="Sale End"
            type="datetime-local"
            value={formData.sale_end}
            onChange={(e) => setFormData({ ...formData, sale_end: e.target.value })}
          />
          <Input
            label="Website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://example.com"
          />
          <Input
            label="Twitter"
            value={formData.twitter}
            onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            placeholder="https://twitter.com/..."
          />
          <Input
            label="Telegram"
            value={formData.telegram}
            onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
            placeholder="https://t.me/..."
          />
          <Input
            label="Logo URL"
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            placeholder="https://..."
          />
          <div className="md:col-span-2">
            <Input
              label="Banner URL"
              value={formData.banner_url}
              onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button onClick={handleCreateProject} loading={isCreating} className="flex-1">
            Create Project
          </Button>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
};
