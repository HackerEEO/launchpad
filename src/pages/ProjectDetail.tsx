import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProject } from '@/hooks/useProjects';
import { useWallet } from '@/hooks/useWallet';
import { useIDOPool } from '@/contracts/hooks';
import { investmentsService } from '@/services/investments.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Loading } from '@/components/ui/Loading';
import { TransactionModal, TransactionStatus } from '@/components/ui/TransactionModal';
import { calculateProgress, formatCurrency, formatNumber } from '@/utils/helpers';
import { getExplorerTxUrl, DEFAULT_CHAIN_ID } from '@/contracts/addresses';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { project, loading } = useProject(id);
  const { address, isConnected, connect, chainId } = useWallet();
  const { invest: investOnChain, loading: txLoading } = useIDOPool();
  
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string | undefined>();
  const [txError, setTxError] = useState<string | undefined>();
  const [gasEstimate, setGasEstimate] = useState<{
    gasLimit: string;
    gasCost: string;
    totalCost: string;
  } | undefined>();

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
        <Link to="/projects">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const progress = calculateProgress(project.raised_amount, project.hard_cap);

  const statusVariant = {
    upcoming: 'info' as const,
    live: 'success' as const,
    ended: 'default' as const,
  };

  const tokenomicsData = [
    { name: 'Public Sale', value: 30, color: '#8B5CF6' },
    { name: 'Team', value: 15, color: '#06B6D4' },
    { name: 'Liquidity', value: 20, color: '#3B82F6' },
    { name: 'Marketing', value: 10, color: '#EC4899' },
    { name: 'Development', value: 15, color: '#10B981' },
    { name: 'Reserve', value: 10, color: '#F59E0B' },
  ];

  const handleInvest = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!investmentAmount || Number(investmentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Check if project has a contract address for on-chain investment
    const poolAddress = project.contract_address;
    
    if (poolAddress) {
      // On-chain investment flow
      setShowInvestModal(false);
      setShowTxModal(true);
      setTxStatus('pending');
      setTxHash(undefined);
      setTxError(undefined);

      try {
        const txHashResult = await investOnChain(poolAddress, investmentAmount);
        
        if (txHashResult) {
          setTxHash(txHashResult);
          setTxStatus('success');
          
          // Record in database after on-chain success
          const amount = Number(investmentAmount);
          const tokensPurchased = amount / project.token_price;
          
          await investmentsService.create({
            user_wallet: address!,
            project_id: project.id,
            amount_invested: amount,
            tokens_purchased: tokensPurchased,
            transaction_hash: txHashResult,
          });
          
          setInvestmentAmount('');
        } else {
          setTxStatus('error');
          setTxError('Transaction failed or was rejected');
        }
      } catch (error: any) {
        setTxStatus('error');
        setTxError(error.message || 'Investment failed');
      }
    } else {
      // Fallback: Database-only flow (for projects without smart contracts)
      setIsInvesting(true);
      try {
        const amount = Number(investmentAmount);
        const tokensPurchased = amount / project.token_price;

        // Generate a placeholder hash for testnet/demo purposes
        const placeholderHash = `0x${Date.now().toString(16)}${'0'.repeat(48)}`;
        
        await investmentsService.create({
          user_wallet: address!,
          project_id: project.id,
          amount_invested: amount,
          tokens_purchased: tokensPurchased,
          transaction_hash: placeholderHash,
        });

        toast.success('Investment recorded successfully!');
        setShowInvestModal(false);
        setInvestmentAmount('');
      } catch (error: any) {
        toast.error(error.message || 'Investment failed');
      } finally {
        setIsInvesting(false);
      }
    }
  };

  const handleRetryInvest = () => {
    setTxStatus('idle');
    setTxError(undefined);
    setShowTxModal(false);
    setShowInvestModal(true);
  };

  const currentChainId = chainId || DEFAULT_CHAIN_ID;
  const explorerUrl = txHash ? getExplorerTxUrl(currentChainId, txHash) : undefined;

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-bold mb-3">About Project</h3>
            <p className="text-text-secondary leading-relaxed">{project.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Token Name', value: project.token_name },
              { label: 'Symbol', value: project.token_symbol },
              { label: 'Total Supply', value: formatNumber(project.total_supply) },
              { label: 'Price', value: `$${project.token_price}` },
            ].map((item, index) => (
              <div key={index} className="glass-card p-4">
                <div className="text-text-muted text-sm mb-1">{item.label}</div>
                <div className="text-white font-semibold">{item.value}</div>
              </div>
            ))}
          </div>

          {project.vesting_schedule && (
            <div className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4">Vesting Schedule</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-text-muted text-sm mb-1">TGE Unlock</div>
                  <div className="text-white font-semibold text-lg">
                    {project.vesting_schedule.tge_percent}%
                  </div>
                </div>
                <div>
                  <div className="text-text-muted text-sm mb-1">Cliff Period</div>
                  <div className="text-white font-semibold text-lg">
                    {project.vesting_schedule.cliff_months} months
                  </div>
                </div>
                <div>
                  <div className="text-text-muted text-sm mb-1">Vesting Period</div>
                  <div className="text-white font-semibold text-lg">
                    {project.vesting_schedule.vesting_months} months
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'tokenomics',
      label: 'Tokenomics',
      content: (
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-6">Token Distribution</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tokenomicsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tokenomicsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      {project.banner_url && (
        <div className="relative h-96 overflow-hidden">
          <img
            src={project.banner_url}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass-card p-8 mb-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {project.logo_url && (
                <img
                  src={project.logo_url}
                  alt={project.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{project.name}</h1>
                    <p className="text-text-secondary">{project.token_symbol}</p>
                  </div>
                  <Badge variant={statusVariant[project.status]}>
                    {project.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex gap-3">
                  {project.website && (
                    <a
                      href={project.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card p-2 hover:bg-card-hover transition-all"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                    </a>
                  )}
                  {project.twitter && (
                    <a
                      href={project.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card p-2 hover:bg-card-hover transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  )}
                  {project.telegram && (
                    <a
                      href={project.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card p-2 hover:bg-card-hover transition-all"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Tabs tabs={tabs} />
            </div>

            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Sale Progress</h3>
                <ProgressBar progress={progress} />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Raised</span>
                    <span className="font-semibold">{formatCurrency(project.raised_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Target</span>
                    <span className="font-semibold">{formatCurrency(project.hard_cap)}</span>
                  </div>
                </div>
              </div>

              {project.status === 'live' && (
                <div className="glass-card p-6">
                  <CountdownTimer
                    targetDate={project.sale_end}
                    label="Sale ends in"
                  />
                </div>
              )}

              {project.status === 'upcoming' && (
                <div className="glass-card p-6">
                  <CountdownTimer
                    targetDate={project.sale_start}
                    label="Sale starts in"
                  />
                </div>
              )}

              {project.status === 'live' && (
                <Button
                  onClick={() => setShowInvestModal(true)}
                  className="w-full"
                  size="lg"
                >
                  Invest Now
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <Modal
        isOpen={showInvestModal}
        onClose={() => setShowInvestModal(false)}
        title="Invest in Project"
      >
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="flex justify-between mb-2">
              <span className="text-text-muted">Token Price</span>
              <span className="font-semibold">${project.token_price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Your Investment</span>
              <span className="font-semibold">
                {investmentAmount ? `${Number(investmentAmount) / project.token_price} ${project.token_symbol}` : '-'}
              </span>
            </div>
          </div>

          <Input
            type="number"
            label="Investment Amount (USD)"
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(e.target.value)}
            placeholder="Enter amount"
          />

          <Button
            onClick={handleInvest}
            loading={isInvesting}
            disabled={!investmentAmount}
            className="w-full"
          >
            {isConnected ? 'Confirm Investment' : 'Connect Wallet'}
          </Button>
        </div>
      </Modal>

      {/* Transaction Status Modal */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        status={txStatus}
        title="Investment Transaction"
        txHash={txHash}
        explorerUrl={explorerUrl}
        errorMessage={txError}
        onRetry={handleRetryInvest}
        amount={investmentAmount}
        tokenSymbol="ETH"
      />
    </div>
  );
};
