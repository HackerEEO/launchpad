import { useState, useCallback } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { TokenVestingABI } from '../abis';
import { useWalletStore } from '../../store/walletStore';

export interface VestingSchedule {
  beneficiary: string;
  totalAmount: bigint;
  releasedAmount: bigint;
  tgeAmount: bigint;
  tgeTimestamp: number;
  cliffDuration: number;
  vestingDuration: number;
  revoked: boolean;
}

export interface UseVestingReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Read functions
  getSchedule: (vestingAddress: string, scheduleId: string) => Promise<VestingSchedule | null>;
  getScheduleId: (vestingAddress: string, beneficiary: string, index: number) => Promise<string | null>;
  getScheduleCount: (vestingAddress: string, beneficiary: string) => Promise<number>;
  getReleasableAmount: (vestingAddress: string, scheduleId: string) => Promise<bigint>;
  getVestedAmount: (vestingAddress: string, scheduleId: string) => Promise<bigint>;
  getAllSchedulesForBeneficiary: (vestingAddress: string, beneficiary: string) => Promise<VestingSchedule[]>;
  
  // Write functions
  release: (vestingAddress?: string, scheduleId?: string) => Promise<string | null>;
  transferBeneficiary: (vestingAddress: string, scheduleId: string, newBeneficiary: string) => Promise<string | null>;

  // Compatibility
  vestingSchedule?: VestingSchedule | null;
  releasableAmount?: string;
  refreshSchedule?: () => Promise<void>;
  getVestedPercentage?: () => number;
  getTimeUntilNextRelease?: () => number;
  isCliffPassed?: () => boolean;
}
export function useVesting(vestingAddress?: string): UseVestingReturn {
  const [loading, setLoading] = useState<boolean>(!!vestingAddress);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useWalletStore();
  const [vestingSchedule, setVestingSchedule] = useState<VestingSchedule | null>(null);
  const [releasableAmt, setReleasableAmt] = useState<string>('0');

  const getProvider = useCallback(async (): Promise<BrowserProvider | null> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet provider found');
      return null;
    }
    return new BrowserProvider(window.ethereum);
  }, []);

  const getContract = useCallback(async (
    vestingAddress: string,
    withSigner = false
  ): Promise<Contract | null> => {
    const provider = await getProvider();
    if (!provider) return null;

    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(vestingAddress, TokenVestingABI, signer);
    }
    
    return new Contract(vestingAddress, TokenVestingABI, provider);
  }, [getProvider]);

  // Read functions
  const getSchedule = useCallback(async (
    vestingAddress: string,
    scheduleId: string
  ): Promise<VestingSchedule | null> => {
    try {
      setError(null);
      const contract = await getContract(vestingAddress);
      if (!contract) return null;

      const schedule = await contract.getVestingSchedule(scheduleId);
      
      return {
        beneficiary: schedule[0],
        totalAmount: schedule[1],
        tgeAmount: schedule[2],
        tgeTimestamp: Number(schedule[3]),
        cliffDuration: Number(schedule[4]),
        vestingDuration: Number(schedule[5]),
        releasedAmount: schedule[6],
        revoked: schedule[7],
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get schedule');
      return null;
    }
  }, [getContract]);

  // refreshSchedule will be defined after helpers that it depends on

  const getScheduleId = useCallback(async (
    vestingAddress: string,
    beneficiary: string,
    index: number
  ): Promise<string | null> => {
    try {
      setError(null);
      const contract = await getContract(vestingAddress);
      if (!contract) return null;

  // The TokenVesting contract exposes schedule IDs via getScheduleIds
  const ids: string[] = await contract.getScheduleIds(beneficiary);
  return ids[index] ?? null;
    } catch (err: any) {
      setError(err.message || 'Failed to get schedule ID');
      return null;
    }
  }, [getContract]);

  const getScheduleCount = useCallback(async (
    vestingAddress: string,
    beneficiary: string
  ): Promise<number> => {
    try {
      setError(null);
      const contract = await getContract(vestingAddress);
      if (!contract) return 0;

      const count = await contract.getVestingScheduleCountByBeneficiary(beneficiary);
      return Number(count);
    } catch (err: any) {
      setError(err.message || 'Failed to get schedule count');
      return 0;
    }
  }, [getContract]);

  const getReleasableAmount = useCallback(async (
    vestingAddress: string,
    scheduleId: string
  ): Promise<bigint> => {
    try {
      setError(null);
      const contract = await getContract(vestingAddress);
      if (!contract) return BigInt(0);

  return await contract.releasableAmount(scheduleId);
    } catch (err: any) {
      setError(err.message || 'Failed to get releasable amount');
      return BigInt(0);
    }
  }, [getContract]);

  const refreshSchedule = useCallback(async (): Promise<void> => {
    if (!vestingAddress) return;
    setLoading(true);
    try {
      // Attempt to read the schedule by using getVestingSchedule(beneficiary)
      const schedule = await getSchedule(vestingAddress, address || '');
      setVestingSchedule(schedule);

      // Try to read releasable amount
      try {
        const amount = await getReleasableAmount(vestingAddress, address || '');
        // format using simple conversion (18 decimals)
        const formatted = (Number(amount) / 1e18).toString();
        setReleasableAmt(formatted);
      } catch {
        setReleasableAmt('0');
      }
    } finally {
      setLoading(false);
    }
  }, [getSchedule, getReleasableAmount, vestingAddress, address]);

  const getVestedAmount = useCallback(async (
    vestingAddress: string,
    scheduleId: string
  ): Promise<bigint> => {
    try {
      setError(null);
      const contract = await getContract(vestingAddress);
      if (!contract) return BigInt(0);

  return await contract.vestedAmount(scheduleId);
    } catch (err: any) {
      setError(err.message || 'Failed to get vested amount');
      return BigInt(0);
    }
  }, [getContract]);

  const getAllSchedulesForBeneficiary = useCallback(async (
    vestingAddress: string,
    beneficiary: string
  ): Promise<VestingSchedule[]> => {
    try {
      setError(null);
      const contract = await getContract(vestingAddress);
      if (!contract) return [];

      const ids: string[] = await contract.getScheduleIds(beneficiary);
      const schedules: VestingSchedule[] = [];

      for (const id of ids) {
        const schedule = await getSchedule(vestingAddress, id);
        if (schedule) schedules.push(schedule);
      }

      return schedules;
    } catch (err: any) {
      setError(err.message || 'Failed to get schedules');
      return [];
    }
  }, [getContract, getScheduleCount, getScheduleId, getSchedule]);

  // Write functions
  const release = useCallback(async (vestingAddressArg?: string, _scheduleId?: string): Promise<string | null> => {
    const target = vestingAddressArg || vestingAddress;
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }
    if (!target) return null;

    try {
      setLoading(true);
      setError(null);

      const contract = await getContract(target, true);
      if (!contract) return null;

      // TokenVesting.release does not require params in the current contract
      const tx = await contract.release();
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (err: any) {
      const message = err.reason || err.message || 'Release failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getContract, isConnected, address, vestingAddress]);

  const getVestedPercentage = useCallback((): number => {
    if (!vestingSchedule) return 0;
    if (vestingSchedule.totalAmount === BigInt(0)) return 0;
    return (Number(vestingSchedule.releasedAmount) / Number(vestingSchedule.totalAmount)) * 100;
  }, [vestingSchedule]);

  const getTimeUntilNextRelease = useCallback((): number => {
    if (!vestingSchedule) return 0;
    const now = Math.floor(Date.now() / 1000);
    // simplistic: time until TGE (tgeTimestamp) or 0
    return Math.max(0, vestingSchedule.tgeTimestamp - now);
  }, [vestingSchedule]);

  const isCliffPassed = useCallback((): boolean => {
    if (!vestingSchedule) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= vestingSchedule.tgeTimestamp + vestingSchedule.cliffDuration;
  }, [vestingSchedule]);

  const transferBeneficiary = useCallback(async (
    _vestingAddress: string,
    _scheduleId: string,
    _newBeneficiary: string
  ): Promise<string | null> => {
    // Not implemented in current TokenVesting contract
    setError('transferBeneficiary is not supported by the current contract');
    return null;
  }, [getContract, isConnected, address]);

  return {
    loading,
    error,
    getSchedule,
    getScheduleId,
    getScheduleCount,
    getReleasableAmount,
    getVestedAmount,
    getAllSchedulesForBeneficiary,
    release,
    transferBeneficiary,
    // compatibility
    vestingSchedule,
    releasableAmount: releasableAmt,
    refreshSchedule,
    getVestedPercentage,
    getTimeUntilNextRelease,
    isCliffPassed,
  };
}
