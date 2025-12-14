import { useState, useCallback } from 'react';
import { ethers, BrowserProvider, Contract } from 'ethers';
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
  invest: (poolAddress: string, amount: string) => Promise<string | null>;
  claim: (poolAddress: string) => Promise<string | null>;
  refund: (poolAddress: string) => Promise<string | null>;
}

export function useIDOPool(): UseIDOPoolReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useWalletStore();

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
    poolAddress: string,
    amount: string
  ): Promise<string | null> => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const contract = await getContract(poolAddress, true);
      if (!contract) return null;

      const amountWei = ethers.parseEther(amount);
      const tx = await contract.invest({ value: amountWei });
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (err: any) {
      const message = err.reason || err.message || 'Investment failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getContract, isConnected, address]);

  const claim = useCallback(async (poolAddress: string): Promise<string | null> => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const contract = await getContract(poolAddress, true);
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
  }, [getContract, isConnected, address]);

  const refund = useCallback(async (poolAddress: string): Promise<string | null> => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const contract = await getContract(poolAddress, true);
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
  }, [getContract, isConnected, address]);

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
  };
}
