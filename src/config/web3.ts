/**
 * @file web3.ts
 * @description Production-ready multi-chain configuration for CryptoLaunch
 * Supports Ethereum Mainnet, Arbitrum One, Base, Polygon, Optimism, and Sepolia testnet
 */

// Helper to safely access env vars (Vite specific)
const env = (import.meta as any).env || {};

/**
 * Chain configuration interface
 */
export interface ChainConfig {
  chainId: number;
  chainIdHex: string;
  name: string;
  shortName: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  iconUrl?: string;
}

/**
 * Supported blockchain networks
 * Configure RPC URLs via environment variables for production
 */
export const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  ETHEREUM: {
    chainId: 1,
    chainIdHex: '0x1',
    name: 'Ethereum',
    shortName: 'eth',
    rpcUrl: env.VITE_RPC_URL_MAINNET || 'https://eth.llamarpc.com',
    blockExplorer: env.VITE_BLOCK_EXPLORER_ETH || 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    iconUrl: '/icons/ethereum.svg',
  },
  ARBITRUM: {
    chainId: 42161,
    chainIdHex: '0xa4b1',
    name: 'Arbitrum One',
    shortName: 'arb1',
    rpcUrl: env.VITE_RPC_URL_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
    blockExplorer: env.VITE_BLOCK_EXPLORER_ARB || 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    iconUrl: '/icons/arbitrum.svg',
  },
  BASE: {
    chainId: 8453,
    chainIdHex: '0x2105',
    name: 'Base',
    shortName: 'base',
    rpcUrl: env.VITE_RPC_URL_BASE || 'https://mainnet.base.org',
    blockExplorer: env.VITE_BLOCK_EXPLORER_BASE || 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    iconUrl: '/icons/base.svg',
  },
  POLYGON: {
    chainId: 137,
    chainIdHex: '0x89',
    name: 'Polygon',
    shortName: 'matic',
    rpcUrl: env.VITE_RPC_URL_POLYGON || 'https://polygon-rpc.com',
    blockExplorer: env.VITE_BLOCK_EXPLORER_POLYGON || 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    isTestnet: false,
    iconUrl: '/icons/polygon.svg',
  },
  OPTIMISM: {
    chainId: 10,
    chainIdHex: '0xa',
    name: 'Optimism',
    shortName: 'op',
    rpcUrl: env.VITE_RPC_URL_OPTIMISM || 'https://mainnet.optimism.io',
    blockExplorer: env.VITE_BLOCK_EXPLORER_OPTIMISM || 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isTestnet: false,
    iconUrl: '/icons/optimism.svg',
  },
  SEPOLIA: {
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    name: 'Sepolia',
    shortName: 'sep',
    rpcUrl: env.VITE_RPC_URL_SEPOLIA || 'https://rpc.sepolia.org',
    blockExplorer: env.VITE_BLOCK_EXPLORER_SEPOLIA || 'https://sepolia.etherscan.io',
    nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
    isTestnet: true,
    iconUrl: '/icons/ethereum.svg',
  },
} as const;

/**
 * Chain ID to chain key mapping for quick lookup
 */
export const CHAIN_ID_MAP: Record<number, keyof typeof SUPPORTED_CHAINS> = {
  1: 'ETHEREUM',
  42161: 'ARBITRUM',
  8453: 'BASE',
  137: 'POLYGON',
  10: 'OPTIMISM',
  11155111: 'SEPOLIA',
};

/**
 * Get chain configuration by chain ID
 */
export function getChainById(chainId: number): ChainConfig | null {
  const key = CHAIN_ID_MAP[chainId];
  return key ? SUPPORTED_CHAINS[key] : null;
}

/**
 * Get default chain based on VITE_CHAIN_ID environment variable
 * Falls back to Arbitrum for production or Sepolia for development
 */
export const DEFAULT_CHAIN: ChainConfig = (() => {
  const envChainId = parseInt(env.VITE_CHAIN_ID || '0', 10);
  
  // Try to find matching chain from env
  const matchedChain = Object.values(SUPPORTED_CHAINS).find(
    (chain) => chain.chainId === envChainId
  );
  
  if (matchedChain) {
    return matchedChain;
  }
  
  // Fallback: Use Arbitrum for production, Sepolia for development
  const isProduction = env.MODE === 'production' || env.PROD;
  return isProduction ? SUPPORTED_CHAINS.ARBITRUM : SUPPORTED_CHAINS.SEPOLIA;
})();

/**
 * Legacy chain config for wallet_addEthereumChain
 */
export const CHAIN_CONFIG = {
  chainId: DEFAULT_CHAIN.chainIdHex,
  chainName: DEFAULT_CHAIN.name,
  nativeCurrency: DEFAULT_CHAIN.nativeCurrency,
  rpcUrls: [DEFAULT_CHAIN.rpcUrl],
  blockExplorerUrls: [DEFAULT_CHAIN.blockExplorer],
};

/**
 * Get all mainnet chains (excludes testnets)
 */
export function getMainnetChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter((chain) => !chain.isTestnet);
}

/**
 * Get all testnet chains
 */
export function getTestnetChains(): ChainConfig[] {
  return Object.values(SUPPORTED_CHAINS).filter((chain) => chain.isTestnet);
}

/**
 * Check if a chain ID is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_ID_MAP;
}

/**
 * Get supported chain IDs for WalletConnect
 */
export function getSupportedChainIds(): number[] {
  return Object.values(SUPPORTED_CHAINS).map((chain) => chain.chainId);
}

/**
 * Get mainnet chain IDs for WalletConnect
 */
export function getMainnetChainIds(): number[] {
  return getMainnetChains().map((chain) => chain.chainId);
}

/**
 * Format chain ID to hex string
 */
export function chainIdToHex(chainId: number): string {
  return `0x${chainId.toString(16)}`;
}

/**
 * Parse hex chain ID to number
 */
export function hexToChainId(hex: string): number {
  return parseInt(hex, 16);
}

export default SUPPORTED_CHAINS;