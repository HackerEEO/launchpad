import { useEffect, useState } from 'react';
import { investmentsService } from '@/services/investments.service';
import type { Investment } from '@/types';
import toast from 'react-hot-toast';

export const useInvestments = (walletAddress: string | null) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    const loadInvestments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await investmentsService.getByWallet(walletAddress);
        setInvestments(data);
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load investments');
      } finally {
        setLoading(false);
      }
    };

    loadInvestments();
  }, [walletAddress]);

  const refresh = async () => {
    if (!walletAddress) return;

    try {
      const data = await investmentsService.getByWallet(walletAddress);
      setInvestments(data);
    } catch (err: any) {
      console.error('Failed to refresh investments:', err);
    }
  };

  return {
    investments,
    loading,
    error,
    refresh,
  };
};

export const usePortfolio = (walletAddress: string | null) => {
  const [portfolio, setPortfolio] = useState({
    totalInvested: 0,
    totalTokens: 0,
    totalClaimed: 0,
    claimableTokens: 0,
    investmentCount: 0,
    investments: [] as Investment[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const loadPortfolio = async () => {
      try {
        setLoading(true);
        const data = await investmentsService.getPortfolioStats(walletAddress);
        setPortfolio(data);
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [walletAddress]);

  return {
    portfolio,
    loading,
  };
};
