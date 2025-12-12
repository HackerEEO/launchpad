// Contract addresses configuration
// Update these after deployment to each network

export interface ContractAddresses {
  WHITELIST: string;
  TOKEN_VESTING: string;
  LAUNCHPAD_FACTORY: string;
  MOCK_TOKEN?: string;
}

// Sepolia Testnet (Chain ID: 11155111)
export const SEPOLIA_ADDRESSES: ContractAddresses = {
  WHITELIST: "", // Deploy and update
  TOKEN_VESTING: "", // Deploy and update
  LAUNCHPAD_FACTORY: "", // Deploy and update
  MOCK_TOKEN: "", // Optional for testing
};

// Ethereum Mainnet (Chain ID: 1)
export const MAINNET_ADDRESSES: ContractAddresses = {
  WHITELIST: "", // Deploy and update
  TOKEN_VESTING: "", // Deploy and update
  LAUNCHPAD_FACTORY: "", // Deploy and update
};

// Arbitrum One (Chain ID: 42161)
export const ARBITRUM_ADDRESSES: ContractAddresses = {
  WHITELIST: "", // Deploy and update
  TOKEN_VESTING: "", // Deploy and update
  LAUNCHPAD_FACTORY: "", // Deploy and update
};

// Polygon Mainnet (Chain ID: 137)
export const POLYGON_ADDRESSES: ContractAddresses = {
  WHITELIST: "", // Deploy and update
  TOKEN_VESTING: "", // Deploy and update
  LAUNCHPAD_FACTORY: "", // Deploy and update
};

// Map chain IDs to addresses
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  1: MAINNET_ADDRESSES,
  11155111: SEPOLIA_ADDRESSES,
  42161: ARBITRUM_ADDRESSES,
  137: POLYGON_ADDRESSES,
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
