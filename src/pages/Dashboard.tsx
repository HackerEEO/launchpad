import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { usePortfolio, useInvestments } from '@/hooks/useInvestments';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { formatCurrency, formatDateTime, formatWalletAddress } from '@/utils/helpers';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { address, isConnected, connect } = useWallet();
  const { portfolio, loading: portfolioLoading } = usePortfolio(address);
  const { investments, loading: investmentsLoading } = useInvestments(address);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-text-secondary mb-6">
              Connect your wallet to view your investment portfolio and transaction history
            </p>
            <Button onClick={connect} className="w-full">
              Connect Wallet
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (portfolioLoading || investmentsLoading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Your <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-text-secondary">
            Wallet: {formatWalletAddress(address || '', 6)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Invested',
              value: formatCurrency(portfolio.totalInvested),
              icon: '💰',
              color: 'from-primary to-primary-light',
            },
            {
              label: 'Total Tokens',
              value: formatCurrency(portfolio.totalTokens),
              icon: '🪙',
              color: 'from-cyan to-cyan-light',
            },
            {
              label: 'Claimable Tokens',
              value: formatCurrency(portfolio.claimableTokens),
              icon: '✨',
              color: 'from-accent-blue to-accent-pink',
            },
            {
              label: 'Projects',
              value: portfolio.investmentCount.toString(),
              icon: '🚀',
              color: 'from-green-500 to-green-400',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="h-full">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${stat.color} mb-4 text-2xl`}>
                  {stat.icon}
                </div>
                <div className="text-text-muted text-sm mb-1">{stat.label}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-6">Investment History</h2>

          {investments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-text-secondary mb-2">No investments yet</p>
              <p className="text-text-muted mb-6">Start investing in exciting projects</p>
              <Link to="/projects">
                <Button>Browse Projects</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Project</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Tokens</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-text-muted font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment) => (
                    <tr key={investment.id} className="border-b border-white/10 hover:bg-card-hover transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {investment.project?.logo_url && (
                            <img
                              src={investment.project.logo_url}
                              alt={investment.project.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="font-semibold">{investment.project?.name || 'Unknown'}</div>
                            <div className="text-sm text-text-muted">{investment.project?.token_symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold">
                        {formatCurrency(Number(investment.amount_invested))}
                      </td>
                      <td className="py-4 px-4">
                        {Number(investment.tokens_purchased).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-text-secondary text-sm">
                        {formatDateTime(investment.created_at)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="success">Confirmed</Badge>
                      </td>
                      <td className="py-4 px-4">
                        {Number(investment.tokens_purchased) > Number(investment.claimed_amount) ? (
                          <Button size="sm" variant="secondary">
                            Claim
                          </Button>
                        ) : (
                          <span className="text-text-muted text-sm">Claimed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
