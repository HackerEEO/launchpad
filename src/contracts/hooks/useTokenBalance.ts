/**
 * @file useTokenBalance.ts
 * @description React hook for interacting with ERC20 tokens
 * Provides methods for checking balances, allowances, and approving tokens
 */

import { useState, useCallback } from 'react';
import { Contract, formatUnits, parseUnits, BrowserProvider } from 'ethers';
import { useWalletStore } from '@/store/walletStore';
import { getExplorerTxUrl, DEFAULT_CHAIN_ID } from '@/contracts/addresses';
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
}

export function useTokenBalance(): UseTokenBalanceReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      const amountWei = parseUnits(amount, decimals);
      
      toast.loading('Approving tokens...', { id: 'approve-tx' });
      
      const tx = await contract.approve(spender, amountWei);
      const currentChainId = chainId || DEFAULT_CHAIN_ID;
      const explorerUrl = getExplorerTxUrl(currentChainId, tx.hash);
      
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
    return formatUnits(balance, decimals);
  }, []);

  /**
   * Parse a human readable amount to bigint
   * @param amount - Amount as string
   * @param decimals - Token decimals (default 18)
   * @returns Parsed amount as bigint
   */
  const parseAmount = useCallback((amount: string, decimals: number = 18): bigint => {
    return parseUnits(amount, decimals);
  }, []);

  return {
    loading,
    error,
    getTokenInfo,
    balanceOf,
    allowance,
    approve,
    formatBalance,
    parseAmount,
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
