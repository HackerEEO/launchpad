/**
 * @file useTokenBalance.ts
 * @description React hook for interacting with ERC20 tokens
 * Provides methods for checking balances, allowances, and approving tokens
 */

import { useState, useCallback, useEffect } from 'react';
import * as ethers from 'ethers';
import { Contract, BrowserProvider } from 'ethers';
import { useWalletStore } from '@/store/walletStore';
import { ERC20ABI } from '@/contracts/abis';
import toast from 'react-hot-toast';

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}

export interface UseTokenBalanceReturn {
  loading: boolean;
  error: string | null;
  
  // Read functions
  getTokenInfo: (tokenAddress: string) => Promise<TokenInfo | null>;
  balanceOf: (tokenAddress: string, account: string) => Promise<bigint>;
  allowance: (tokenAddress: string, owner: string, spender: string) => Promise<bigint>;
  
  // Write functions
  approve: (tokenAddress: string, spender: string, amount: string, decimals?: number) => Promise<string | null>;
  
  // Utilities
  formatBalance: (balance: bigint, decimals?: number) => string;
  parseAmount: (amount: string, decimals?: number) => bigint;

  // Compatibility: when the hook is called with tokenAddress and account
  balance?: string;
  refresh?: () => Promise<void>;
}
export function useTokenBalance(tokenAddress?: string, account?: string): UseTokenBalanceReturn {
  const [loading, setLoading] = useState<boolean>(() => Boolean(tokenAddress && account));
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const { address, isConnected, chainId } = useWalletStore();

  const getProvider = useCallback(async (): Promise<BrowserProvider | null> => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet provider found');
      return null;
    }
    return new BrowserProvider(window.ethereum);
  }, []);

  const getContract = useCallback(async (
    tokenAddress: string,
    withSigner = false
  ): Promise<Contract | null> => {
    const provider = await getProvider();
    if (!provider) return null;

    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(tokenAddress, ERC20ABI, signer);
    }
    
    return new Contract(tokenAddress, ERC20ABI, provider);
  }, [getProvider]);

  // Helpers to support test mocks that may place formatUnits/parseUnits
  // under a nested `ethers` object (some tests mock the module that way).
  const safeFormatUnits = useCallback((value: bigint, decimals = 18) => {
    // prefer direct export, fall back to nested mock shapes
    const f = (ethers as any).formatUnits ?? (ethers as any).ethers?.formatUnits;
    if (!f) return '0';
    return f(value, decimals);
  }, []);

  const safeParseUnits = useCallback((value: string, decimals = 18) => {
    const p = (ethers as any).parseUnits ?? (ethers as any).ethers?.parseUnits;
    if (!p) return BigInt(0);
    return p(value, decimals);
  }, []);

  /**
   * Get token metadata
   * @param tokenAddress - ERC20 token contract address
   * @returns Token info or null if error
   */
  const getTokenInfo = useCallback(async (tokenAddress: string): Promise<TokenInfo | null> => {
    try {
      setError(null);
      const contract = await getContract(tokenAddress);
      if (!contract) return null;

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.totalSupply(),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        totalSupply,
      };
    } catch (err: any) {
      setError(err.message || 'Failed to get token info');
      return null;
    }
  }, [getContract]);

  /**
   * Get token balance for an account
   * @param tokenAddress - ERC20 token contract address
   * @param account - Wallet address to check
   * @returns Token balance as bigint
   */
  const balanceOf = useCallback(async (
    tokenAddress: string,
    account: string
  ): Promise<bigint> => {
    try {
      setError(null);
      const contract = await getContract(tokenAddress);
      if (!contract) return BigInt(0);

      return await contract.balanceOf(account);
    } catch (err: any) {
      setError(err.message || 'Failed to get balance');
      return BigInt(0);
    }
  }, [getContract]);

  // (refresh is defined after helpers to ensure formatBalance is available)

  /**
   * Get token allowance for a spender
   * @param tokenAddress - ERC20 token contract address
   * @param owner - Token owner address
   * @param spender - Spender address (usually a contract)
   * @returns Allowance amount as bigint
   */
  const allowance = useCallback(async (
    tokenAddress: string,
    owner: string,
    spender: string
  ): Promise<bigint> => {
    try {
      setError(null);
      const contract = await getContract(tokenAddress);
      if (!contract) return BigInt(0);

      return await contract.allowance(owner, spender);
    } catch (err: any) {
      setError(err.message || 'Failed to get allowance');
      return BigInt(0);
    }
  }, [getContract]);

  /**
   * Approve token spending
   * @param tokenAddress - ERC20 token contract address
   * @param spender - Address to approve (usually IDO pool contract)
   * @param amount - Amount to approve (human readable)
   * @param decimals - Token decimals (default 18)
   * @returns Transaction hash or null if error
   */
  const approve = useCallback(async (
    tokenAddress: string,
    spender: string,
    amount: string,
    decimals: number = 18
  ): Promise<string | null> => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const contract = await getContract(tokenAddress, true);
      if (!contract) return null;

  const amountWei = ethers.parseUnits(amount, decimals);
      
      toast.loading('Approving tokens...', { id: 'approve-tx' });
      
  const tx = await contract.approve(spender, amountWei);
  toast.loading(`Waiting for confirmation...`, { id: 'approve-tx' });
      
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast.success('Approval successful!', { id: 'approve-tx' });
        return receipt.hash;
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err: any) {
      const message = parseApprovalError(err);
      setError(message);
      toast.error(message, { id: 'approve-tx' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [getContract, isConnected, address, chainId]);

  /**
   * Format a token balance for display
   * @param balance - Balance as bigint
   * @param decimals - Token decimals (default 18)
   * @returns Formatted string
   */
  const formatBalance = useCallback((balance: bigint, decimals: number = 18): string => {
    return safeFormatUnits(balance, decimals);
  }, [safeFormatUnits]);

  /**
   * Parse a human readable amount to bigint
   * @param amount - Amount as string
   * @param decimals - Token decimals (default 18)
   * @returns Parsed amount as bigint
   */
  const parseAmount = useCallback((amount: string, decimals: number = 18): bigint => {
    return safeParseUnits(amount, decimals);
  }, [safeParseUnits]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!tokenAddress || !account) return;
    const b = await balanceOf(tokenAddress, account);
    setBalance(formatBalance(b));
  }, [tokenAddress, account, balanceOf, formatBalance]);

  useEffect(() => {
    if (!tokenAddress || !account) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress, account]);

  return {
    loading,
    error,
    getTokenInfo,
    balanceOf,
    allowance,
    approve,
    formatBalance,
    parseAmount,
    balance,
    refresh,
  };
}

/**
 * Parse approval error to user-friendly message
 */
function parseApprovalError(error: any): string {
  const message = error?.message || error?.reason || 'Approval failed';
  
  if (message.includes('user rejected') || message.includes('User denied')) {
    return 'Transaction was rejected';
  }
  
  if (message.includes('insufficient funds')) {
    return 'Insufficient funds for gas';
  }
  
  return message.length > 100 ? 'Approval failed' : message;
}

export default useTokenBalance;
