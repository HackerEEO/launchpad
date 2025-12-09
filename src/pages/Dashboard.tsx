import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { usePortfolio, useInvestments } from '@/hooks/useInvestments';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard, StatIcons } from '@/components/ui/StatCard';
import { ListSkeleton, StatCardSkeleton } from '@/components/ui/LoadingState';
import { EmptyState, EmptyStateIcons } from '@/components/ui/EmptyState';
import { formatCurrency, formatDateTime, formatWalletAddress } from '@/utils/helpers';
import { Link, useNavigate } from 'react-router-dom';
import type { WalletType } from '@/components/wallet/WalletModal';
import { WalletModal } from '@/components/wallet/WalletModal';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { address, isConnected, connect, balance, isConnecting } = useWallet();
  const { portfolio, loading: portfolioLoading } = usePortfolio(address);
  const { investments, loading: investmentsLoading } = useInvestments(address);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const handleConnect = async (walletType: WalletType) => {
    await connect(walletType);
    setIsWalletModalOpen(false);
  };

  // Connect wallet prompt
  if (!isConnected) {
    return (
      <>
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative max-w-lg w-full"
          >
            {/* Background glow effects */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary-500/20 via-transparent to-accent-500/20 blur-3xl" />
            
            <div className="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-xl p-8 md:p-12">
              {/* Decorative elements */}
              <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-48 w-48 translate-y-1/2 -translate-x-1/2 rounded-full bg-accent-500/10 blur-3xl" />

              <div className="relative z-10 text-center">
                {/* Animated wallet icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500"
                >
                  <motion.svg
                    animate={{ rotateY: [0, 180, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="h-12 w-12 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </motion.svg>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-3 text-3xl font-bold text-white"
                >
                  Connect Your Wallet
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8 text-slate-400"
                >
                  Connect your wallet to access your investment portfolio, track earnings, and claim tokens.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    onClick={() => setIsWalletModalOpen(true)}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600"
                  >
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Connect Wallet
                  </Button>
                </motion.div>

                {/* Feature highlights */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 grid grid-cols-3 gap-4 text-center"
                >
                  {[
                    { icon: '🔒', label: 'Secure' },
                    { icon: '⚡', label: 'Fast' },
                    { icon: '🌐', label: 'Multi-Chain' },
                  ].map((item, i) => (
                    <div key={i} className="text-slate-500">
                      <div className="mb-1 text-xl">{item.icon}</div>
                      <div className="text-xs">{item.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>

        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          onSelectWallet={handleConnect}
          isConnecting={isConnecting}
        />
      </>
    );
  }

  // Loading state
  if (portfolioLoading || investmentsLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-700" />
          <div className="mt-2 h-5 w-40 animate-pulse rounded bg-slate-700" />
        </div>
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-slate-700" />
          <ListSkeleton items={5} />
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
      {/* Header Section */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Your <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-sm text-slate-400">
                  {formatWalletAddress(address || '', 6)}
                </span>
              </div>
              <span className="text-sm text-slate-500">
                Balance: {Number(balance).toFixed(4)} ETH
              </span>
            </div>
          </div>

          <Link to="/projects">
            <Button className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Investment
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Invested"
          value={formatCurrency(portfolio.totalInvested)}
          icon={StatIcons.Wallet}
          variant="gradient"
          trend={portfolio.totalInvested > 0 ? { value: 12.5, isPositive: true } : undefined}
        />
        <StatCard
          title="Total Tokens"
          value={formatCurrency(portfolio.totalTokens)}
          icon={StatIcons.Token}
          subtitle="Across all projects"
        />
        <StatCard
          title="Claimable Tokens"
          value={formatCurrency(portfolio.claimableTokens)}
          icon={StatIcons.Gift}
          variant={portfolio.claimableTokens > 0 ? 'gradient' : 'default'}
        />
        <StatCard
          title="Active Projects"
          value={portfolio.investmentCount.toString()}
          icon={StatIcons.Rocket}
          subtitle="In your portfolio"
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={itemVariants}
        className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {[
          { icon: '🔄', label: 'Refresh', onClick: () => window.location.reload() },
          { icon: '📊', label: 'Analytics', onClick: () => {} },
          { icon: '🎁', label: 'Claim All', onClick: () => {}, highlight: portfolio.claimableTokens > 0 },
          { icon: '📜', label: 'History', onClick: () => {} },
        ].map((action, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={action.onClick}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-colors ${
              action.highlight
                ? 'border-primary-500/50 bg-primary-500/10 text-primary-400 hover:bg-primary-500/20'
                : 'border-slate-700/50 bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-sm font-medium">{action.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Investment History */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/20 text-primary-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Investment History</h2>
              <p className="text-sm text-slate-500">Track all your investments and claims</p>
            </div>
          </div>
          
          {investments.length > 0 && (
            <span className="rounded-full bg-slate-700/50 px-3 py-1 text-sm text-slate-400">
              {investments.length} investment{investments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {investments.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-6 py-4"
            >
              <EmptyState
                icon={EmptyStateIcons.NoInvestments}
                title="No Investments Yet"
                description="You haven't made any investments. Explore exciting projects and start building your portfolio today."
                action={{
                  label: 'Browse Projects',
                  onClick: () => navigate('/projects'),
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Project
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Invested
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Tokens
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {investments.map((investment, index) => {
                    const canClaim = Number(investment.tokens_purchased) > Number(investment.claimed_amount);
                    
                    return (
                      <motion.tr
                        key={investment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group transition-colors hover:bg-slate-700/20"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {investment.project?.logo_url ? (
                              <img
                                src={investment.project.logo_url}
                                alt={investment.project.name}
                                className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-700 transition-all group-hover:ring-primary-500/50"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-xl font-bold text-white">
                                {investment.project?.name?.[0] || '?'}
                              </div>
                            )}
                            <div>
                              <Link
                                to={`/projects/${investment.project?.id}`}
                                className="font-semibold text-white transition-colors hover:text-primary-400"
                              >
                                {investment.project?.name || 'Unknown Project'}
                              </Link>
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                <span>{investment.project?.token_symbol}</span>
                                <span className="text-slate-600">•</span>
                                <span className="capitalize">{investment.project?.status}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-lg font-semibold text-white">
                            {formatCurrency(Number(investment.amount_invested))}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {Number(investment.tokens_purchased).toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-sm text-slate-500">
                              {investment.project?.token_symbol}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-400">
                            {formatDateTime(investment.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={canClaim ? 'warning' : 'success'}
                          >
                            {canClaim ? 'Claimable' : 'Claimed'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {canClaim ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                              </svg>
                              Claim
                            </motion.button>
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer tip */}
      <motion.div
        variants={itemVariants}
        className="mt-6 flex items-center justify-center gap-2 text-center text-sm text-slate-500"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Tokens are claimable after the project's vesting period. Check each project for details.
        </span>
      </motion.div>
    </motion.div>
  );
};
