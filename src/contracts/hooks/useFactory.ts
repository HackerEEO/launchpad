import { useState, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { LaunchpadFactoryABI } from '../abis';
import { useWalletStore } from '../../store/walletStore';
import { getContractAddresses } from '../addresses';

export interface PoolDetails {
  poolAddress: string;
  saleToken: string;
  name: string;
  hardCap: bigint;
  startTime: number;
  endTime: number;
  creator: string;
  createdAt: number;
  isActive: boolean;
}

export interface UseFactoryReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Read functions
  getPoolCount: () => Promise<number>;
  getAllPools: () => Promise<string[]>;
  getActivePools: () => Promise<string[]>;
  getPoolsByCreator: (creator: string) => Promise<string[]>;
  getPoolDetails: (poolAddress: string) => Promise<PoolDetails | null>;
  isPool: (address: string) => Promise<boolean>;
  getPlatformFee: () => Promise<number>;
}

export function useLaunchpadFactory(): UseFactoryReturn {
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { chainId } = useWalletStore();

  const getProvider = useCallback(async (): Promise<BrowserProvider | null> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet provider found');
      return null;
    }
    return new BrowserProvider(window.ethereum);
  }, []);

  const getFactoryAddress = useCallback((): string | null => {
    if (!chainId) {
      setError('Chain ID not available');
      return null;
    }

    const addresses = getContractAddresses(chainId);
    if (!addresses || !addresses.LAUNCHPAD_FACTORY) {
      setError(`Factory not deployed on chain ${chainId}`);
      return null;
    }

    return addresses.LAUNCHPAD_FACTORY;
  }, [chainId]);

  const getContract = useCallback(async (): Promise<Contract | null> => {
    const provider = await getProvider();
    if (!provider) return null;

    const factoryAddress = getFactoryAddress();
    if (!factoryAddress) return null;

    return new Contract(factoryAddress, LaunchpadFactoryABI, provider);
  }, [getProvider, getFactoryAddress]);

  // Read functions
  const getPoolCount = useCallback(async (): Promise<number> => {
    try {
      setError(null);
      const contract = await getContract();
      if (!contract) return 0;

      const count = await contract.getPoolCount();
      return Number(count);
    } catch (err: any) {
      setError(err.message || 'Failed to get pool count');
      return 0;
    }
  }, [getContract]);

  const getAllPools = useCallback(async (): Promise<string[]> => {
    try {
      setError(null);
      const contract = await getContract();
      if (!contract) return [];

      return await contract.getAllPools();
    } catch (err: any) {
      setError(err.message || 'Failed to get pools');
      return [];
    }
  }, [getContract]);

  const getActivePools = useCallback(async (): Promise<string[]> => {
    try {
      setError(null);
      const contract = await getContract();
      if (!contract) return [];

      return await contract.getActivePools();
    } catch (err: any) {
      setError(err.message || 'Failed to get active pools');
      return [];
    }
  }, [getContract]);

  const getPoolsByCreator = useCallback(async (creator: string): Promise<string[]> => {
    try {
      setError(null);
      const contract = await getContract();
      if (!contract) return [];

      return await contract.getPoolsByCreator(creator);
    } catch (err: any) {
      setError(err.message || 'Failed to get pools by creator');
      return [];
    }
  }, [getContract]);

  const getPoolDetails = useCallback(async (poolAddress: string): Promise<PoolDetails | null> => {
    try {
      setError(null);
      const contract = await getContract();
      if (!contract) return null;

      const details = await contract.getPoolDetails(poolAddress);
      
      return {
        poolAddress: details[0],
        saleToken: details[1],
        name: details[2],
        hardCap: details[3],
        startTime: Number(details[4]),
        endTime: Number(details[5]),
        creator: details[6],
        createdAt: Number(details[7]),
        isActive: details[8],
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get pool details');
      return null;
    }
  }, [getContract]);

  const isPool = useCallback(async (address: string): Promise<boolean> => {
    try {
      const contract = await getContract();
      if (!contract) return false;

      return await contract.isPool(address);
    } catch {
      return false;
    }
  }, [getContract]);

  const getPlatformFee = useCallback(async (): Promise<number> => {
    try {
      setError(null);
      const contract = await getContract();
      if (!contract) return 0;

      const fee = await contract.platformFee();
      return Number(fee);
    } catch (err: any) {
      setError(err.message || 'Failed to get platform fee');
      return 0;
    }
  }, [getContract]);

  return {
    loading,
    error,
    getPoolCount,
    getAllPools,
    getActivePools,
    getPoolsByCreator,
    getPoolDetails,
    isPool,
    getPlatformFee,
  };
}
