import { useState, useCallback, useEffect } from 'react';
import * as ethers from 'ethers';
import { BrowserProvider, Contract } from 'ethers';
import { IDOPoolABI } from '../abis';
import { useWalletStore } from '../../store/walletStore';

export interface PoolInfo {
  saleToken: string;
  tokenPrice: bigint;
  hardCap: bigint;
  softCap: bigint;
  totalRaised: bigint;
  startTime: number;
  endTime: number;
  isFinalized: boolean;
  minInvestment: bigint;
  maxInvestment: bigint;
  tgePercent: number;
}

export interface InvestorInfo {
  investment: bigint;
  tokenAllocation: bigint;
  claimedAmount: bigint;
  claimableAmount: bigint;
}

export interface UseIDOPoolReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Read functions
  getPoolInfo: (poolAddress: string) => Promise<PoolInfo | null>;
  getInvestorInfo: (poolAddress: string, investorAddress: string) => Promise<InvestorInfo | null>;
  getInvestment: (poolAddress: string, investorAddress: string) => Promise<bigint>;
  isSaleActive: (poolAddress: string) => Promise<boolean>;
  
  // Write functions
  invest: (...args: any[]) => Promise<string | null>;
  claim: (poolAddress?: string) => Promise<string | null>;
  refund: (poolAddress?: string) => Promise<string | null>;

  // Compatibility (optional) - legacy hook used in tests and UI
  poolInfo?: PoolInfo | null;
  investorInfo?: InvestorInfo | null;
  refreshPoolInfo?: () => Promise<void>;
  refreshInvestorInfo?: (investorAddress?: string) => Promise<void>;
  getPoolStatus?: (poolAddress?: string) => string;
  getRaisedPercentage?: (poolAddress?: string) => number;
  getTimeRemaining?: (poolAddress?: string) => number;
}
export function useIDOPool(poolAddress?: string): UseIDOPoolReturn {
  const [loading, setLoading] = useState<boolean>(!!poolAddress);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useWalletStore();
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [investorInfo, setInvestorInfo] = useState<InvestorInfo | null>(null);

  const getProvider = useCallback(async (): Promise<BrowserProvider | null> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet provider found');
      return null;
    }
    return new BrowserProvider(window.ethereum);
  }, []);

  const getContract = useCallback(async (
    poolAddress: string,
    withSigner = false
  ): Promise<Contract | null> => {
    const provider = await getProvider();
    if (!provider) return null;

    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(poolAddress, IDOPoolABI, signer);
    }
    
    return new Contract(poolAddress, IDOPoolABI, provider);
  }, [getProvider]);

  // Read functions
  const getPoolInfo = useCallback(async (poolAddress: string): Promise<PoolInfo | null> => {
    try {
      setError(null);
      const contract = await getContract(poolAddress);
      if (!contract) return null;

      const [
        saleToken,
        tokenPrice,
        hardCap,
        softCap,
        totalRaised,
        startTime,
        endTime,
        isFinalized,
        minInvestment,
        maxInvestment,
        tgePercent,
      ] = await Promise.all([
        contract.saleToken(),
        contract.tokenPrice(),
        contract.hardCap(),
        contract.softCap(),
        contract.totalRaised(),
        contract.startTime(),
        contract.endTime(),
        contract.isFinalized(),
        contract.minInvestment(),
        contract.maxInvestment(),
        contract.tgePercent(),
      ]);

      return {
        saleToken,
        tokenPrice,
        hardCap,
        softCap,
        totalRaised,
        startTime: Number(startTime),
        endTime: Number(endTime),
        isFinalized,
        minInvestment,
        maxInvestment,
        tgePercent: Number(tgePercent),
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get pool info');
      return null;
    }
  }, [getContract]);

  const refreshPoolInfo = useCallback(async (): Promise<void> => {
    if (!poolAddress) return;
    setLoading(true);
    try {
      const info = await getPoolInfo(poolAddress);
      setPoolInfo(info);
    } finally {
      setLoading(false);
    }
  }, [getPoolInfo, poolAddress]);

  // Auto-refresh when a pool address is provided

  const getInvestorInfo = useCallback(async (
    poolAddress: string,
    investorAddress: string
  ): Promise<InvestorInfo | null> => {
    try {
      setError(null);
      const contract = await getContract(poolAddress);
      if (!contract) return null;

      const info = await contract.getInvestorInfo(investorAddress);
      
      return {
        investment: info[0],
        tokenAllocation: info[1],
        claimedAmount: info[2],
        claimableAmount: info[3],
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get investor info');
      return null;
    }
  }, [getContract]);

  const refreshInvestorInfo = useCallback(async (investorAddress?: string): Promise<void> => {
    if (!poolAddress) return;
    if (!investorAddress && !address) return;
    const addr = investorAddress || address!;
    const info = await getInvestorInfo(poolAddress, addr);
    setInvestorInfo(info);
  }, [getInvestorInfo, poolAddress, address]);

  useEffect(() => {
    if (!poolAddress) {
      setPoolInfo(null);
      setInvestorInfo(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (!mounted) return;
        await refreshPoolInfo();
        await refreshInvestorInfo();
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [poolAddress, refreshPoolInfo, refreshInvestorInfo]);

  const getInvestment = useCallback(async (
    poolAddress: string,
    investorAddress: string
  ): Promise<bigint> => {
    try {
      setError(null);
      const contract = await getContract(poolAddress);
      if (!contract) return BigInt(0);

      return await contract.investments(investorAddress);
    } catch (err: any) {
      setError(err.message || 'Failed to get investment');
      return BigInt(0);
    }
  }, [getContract]);

  const isSaleActive = useCallback(async (poolAddress: string): Promise<boolean> => {
    try {
      const contract = await getContract(poolAddress);
      if (!contract) return false;

      return await contract.isSaleActive();
    } catch {
      return false;
    }
  }, [getContract]);

  // Write functions
  const invest = useCallback(async (
    poolAddressOrAmount: string | number,
    maybeAmount?: string | number
  ): Promise<string | null> => {
    let targetPool = poolAddress;
    let amount: string | number;
    if (typeof maybeAmount === 'undefined') {
      amount = poolAddressOrAmount as string | number;
    } else {
      targetPool = poolAddressOrAmount as string;
      amount = maybeAmount as string | number;
    }

    if (!targetPool) {
      setError('Pool address is required');
      return null;
    }

    // validate numeric amounts (run validation even if wallet isn't connected so
    // tests that call invest() without connecting will still get a rejection)
    if (typeof amount === 'number') {
      if (amount <= 0) throw new Error('Amount must be positive');
      amount = String(amount);
    } else if (typeof amount === 'string') {
      const n = Number(amount);
      if (Number.isNaN(n) || n <= 0) throw new Error('Amount must be positive');
    }

    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const contract = await getContract(targetPool, true);
      if (!contract) return null;

      const amountWei = ethers.parseEther(String(amount));
      const tx = await contract.invest({ value: amountWei });
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (err: any) {
      const message = err.reason || err.message || 'Investment failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getContract, isConnected, address, poolAddress]);

  const getPoolStatus = useCallback((pAddress?: string): string => {
    const info = pAddress === poolAddress ? poolInfo : null;
    if (!info) return 'unknown';
    const now = Math.floor(Date.now() / 1000);
    if (now < info.startTime) return 'upcoming';
    if (now >= info.startTime && now <= info.endTime) return 'active';
    return 'ended';
  }, [poolInfo, poolAddress]);

  const getRaisedPercentage = useCallback((pAddress?: string): number => {
    const info = pAddress === poolAddress ? poolInfo : null;
    if (!info || info.hardCap === BigInt(0)) return 0;
    const percent = (Number(info.totalRaised) / Number(info.hardCap)) * 100;
    return Math.min(100, Math.max(0, percent));
  }, [poolInfo, poolAddress]);

  const getTimeRemaining = useCallback((pAddress?: string): number => {
    const info = pAddress === poolAddress ? poolInfo : null;
    if (!info) return 0;
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, info.endTime - now);
  }, [poolInfo, poolAddress]);

  const claim = useCallback(async (poolAddressArg?: string): Promise<string | null> => {
    const targetPool = poolAddressArg || poolAddress;
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }
    if (!targetPool) return null;

    try {
      setLoading(true);
      setError(null);

      const contract = await getContract(targetPool, true);
      if (!contract) return null;

      const tx = await contract.claim();
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (err: any) {
      const message = err.reason || err.message || 'Claim failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getContract, isConnected, address, poolAddress]);

  const refund = useCallback(async (poolAddressArg?: string): Promise<string | null> => {
    const targetPool = poolAddressArg || poolAddress;
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }
    if (!targetPool) return null;

    try {
      setLoading(true);
      setError(null);

      const contract = await getContract(targetPool, true);
      if (!contract) return null;

      const tx = await contract.refund();
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (err: any) {
      const message = err.reason || err.message || 'Refund failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getContract, isConnected, address, poolAddress]);

  return {
    loading,
    error,
    getPoolInfo,
    getInvestorInfo,
    getInvestment,
    isSaleActive,
    invest,
    claim,
    refund,
    // compatibility
    poolInfo,
    investorInfo,
    refreshPoolInfo,
    refreshInvestorInfo,
    getPoolStatus,
    getRaisedPercentage,
    getTimeRemaining,
  };
}
