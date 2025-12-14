// Contract addresses configuration
// Update these after deployment to each network
// Can be overridden via environment variables

// Helper to safely access env vars
const env = (import.meta as any).env || {};

export interface ContractAddresses {
  WHITELIST: string;
  TOKEN_VESTING: string;
  LAUNCHPAD_FACTORY: string;
  MOCK_TOKEN?: string;
}

// Sepolia Testnet (Chain ID: 11155111)
export const SEPOLIA_ADDRESSES: ContractAddresses = {
  WHITELIST: env.VITE_WHITELIST_SEPOLIA || "",
  TOKEN_VESTING: env.VITE_VESTING_CONTRACT_SEPOLIA || "",
  LAUNCHPAD_FACTORY: env.VITE_LAUNCHPAD_FACTORY_SEPOLIA || "",
  MOCK_TOKEN: env.VITE_MOCK_TOKEN_SEPOLIA || "",
};

// Ethereum Mainnet (Chain ID: 1)
export const MAINNET_ADDRESSES: ContractAddresses = {
  WHITELIST: env.VITE_WHITELIST_MAINNET || "",
  TOKEN_VESTING: env.VITE_VESTING_CONTRACT_MAINNET || "",
  LAUNCHPAD_FACTORY: env.VITE_LAUNCHPAD_FACTORY_MAINNET || "",
};

// Arbitrum One (Chain ID: 42161)
export const ARBITRUM_ADDRESSES: ContractAddresses = {
  WHITELIST: env.VITE_WHITELIST_ARBITRUM || "",
  TOKEN_VESTING: env.VITE_VESTING_CONTRACT_ARBITRUM || "",
  LAUNCHPAD_FACTORY: env.VITE_LAUNCHPAD_FACTORY_ARBITRUM || "",
};

// Base (Chain ID: 8453)
export const BASE_ADDRESSES: ContractAddresses = {
  WHITELIST: env.VITE_WHITELIST_BASE || "",
  TOKEN_VESTING: env.VITE_VESTING_CONTRACT_BASE || "",
  LAUNCHPAD_FACTORY: env.VITE_LAUNCHPAD_FACTORY_BASE || "",
};

// Polygon Mainnet (Chain ID: 137)
export const POLYGON_ADDRESSES: ContractAddresses = {
  WHITELIST: env.VITE_WHITELIST_POLYGON || "",
  TOKEN_VESTING: env.VITE_VESTING_CONTRACT_POLYGON || "",
  LAUNCHPAD_FACTORY: env.VITE_LAUNCHPAD_FACTORY_POLYGON || "",
};

// Optimism (Chain ID: 10)
export const OPTIMISM_ADDRESSES: ContractAddresses = {
  WHITELIST: env.VITE_WHITELIST_OPTIMISM || "",
  TOKEN_VESTING: env.VITE_VESTING_CONTRACT_OPTIMISM || "",
  LAUNCHPAD_FACTORY: env.VITE_LAUNCHPAD_FACTORY_OPTIMISM || "",
};

// Map chain IDs to addresses
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  1: MAINNET_ADDRESSES,
  10: OPTIMISM_ADDRESSES,
  137: POLYGON_ADDRESSES,
  8453: BASE_ADDRESSES,
  42161: ARBITRUM_ADDRESSES,
  11155111: SEPOLIA_ADDRESSES,
};

// Block explorer URLs by chain ID
export const EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io',
  10: 'https://optimistic.etherscan.io',
  137: 'https://polygonscan.com',
  8453: 'https://basescan.org',
  42161: 'https://arbiscan.io',
  11155111: 'https://sepolia.etherscan.io',
};

// RPC URLs by chain ID (fallbacks - prefer env vars)
export const RPC_URLS: Record<number, string> = {
  1: env.VITE_RPC_URL_MAINNET || 'https://eth.llamarpc.com',
  10: env.VITE_RPC_URL_OPTIMISM || 'https://mainnet.optimism.io',
  137: env.VITE_RPC_URL_POLYGON || 'https://polygon-rpc.com',
  8453: env.VITE_RPC_URL_BASE || 'https://mainnet.base.org',
  42161: env.VITE_RPC_URL_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
  11155111: env.VITE_RPC_URL_SEPOLIA || 'https://rpc.sepolia.org',
};

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): ContractAddresses | null {
  return CONTRACT_ADDRESSES[chainId] || null;
}

/**
 * Check if contracts are deployed on a chain
 */
export function isChainSupported(chainId: number): boolean {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) return false;
  return !!(addresses.WHITELIST && addresses.TOKEN_VESTING && addresses.LAUNCHPAD_FACTORY);
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(CONTRACT_ADDRESSES)
    .map(Number)
    .filter(isChainSupported);
}

/**
 * Get block explorer URL for a chain
 * @param chainId - The chain ID
 * @returns Block explorer base URL
 */
export function getExplorerUrl(chainId: number): string {
  return EXPLORER_URLS[chainId] || EXPLORER_URLS[1];
}

/**
 * Get transaction URL for block explorer
 * @param chainId - The chain ID
 * @param txHash - Transaction hash
 * @returns Full URL to view transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const baseUrl = getExplorerUrl(chainId);
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Get address URL for block explorer
 * @param chainId - The chain ID
 * @param address - Wallet or contract address
 * @returns Full URL to view address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const baseUrl = getExplorerUrl(chainId);
  return `${baseUrl}/address/${address}`;
}

/**
 * Get RPC URL for a chain
 * @param chainId - The chain ID
 * @returns RPC URL
 */
export function getRpcUrl(chainId: number): string {
  return RPC_URLS[chainId] || RPC_URLS[11155111];
}

/**
 * Default chain ID from environment
 */
export const DEFAULT_CHAIN_ID = parseInt(env.VITE_CHAIN_ID || '11155111', 10);
