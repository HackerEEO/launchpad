export const SUPPORTED_CHAINS = {
  SEPOLIA: {
    chainId: 11155111,
    chainIdHex: '0xaa36a7',
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
} as const;

export const DEFAULT_CHAIN = SUPPORTED_CHAINS.SEPOLIA;

export const CHAIN_CONFIG = {
  chainId: DEFAULT_CHAIN.chainIdHex,
  chainName: DEFAULT_CHAIN.name,
  nativeCurrency: DEFAULT_CHAIN.nativeCurrency,
  rpcUrls: [DEFAULT_CHAIN.rpcUrl],
  blockExplorerUrls: [DEFAULT_CHAIN.blockExplorer],
};
