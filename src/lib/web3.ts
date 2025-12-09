import { BrowserProvider, formatEther, parseEther, JsonRpcSigner } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';
import { DEFAULT_CHAIN, CHAIN_CONFIG } from '@/config/web3';
import { useWalletStore } from '@/store/walletStore';
import toast from 'react-hot-toast';
import type { WalletType } from '@/components/wallet/WalletModal';

// WalletConnect Project ID - Get from https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = (import.meta as any).env?.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

declare global {
  interface Window {
    ethereum?: any;
  }
}

type EthereumProviderType = InstanceType<typeof EthereumProvider>;

interface ProviderState {
  provider: BrowserProvider | null;
  rawProvider: any;
  walletType: WalletType | null;
  wcProvider: EthereumProviderType | null;
}

class Web3Service {
  private state: ProviderState = {
    provider: null,
    rawProvider: null,
    walletType: null,
    wcProvider: null,
  };

  /**
   * Get the appropriate injected provider based on wallet type
   */
  private getInjectedProvider(walletType: WalletType): any {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    try {
      const providers = window.ethereum.providers;
      
      // Filter out problematic extensions that can cause errors
      const isValidProvider = (p: any) => {
        if (!p) return false;
        // Skip known problematic wallet extensions
        if (p.isOkxWallet || p.isSubWallet || p.evmAsk) return false;
        return true;
      };

      if (providers && Array.isArray(providers)) {
        const validProviders = providers.filter(isValidProvider);
        
        switch (walletType) {
          case 'metamask': {
            const mmProvider = validProviders.find((p: any) => p.isMetaMask && !p.isCoinbaseWallet && !p.isBraveWallet);
            return mmProvider || null;
          }
          case 'coinbase': {
            const cbProvider = validProviders.find((p: any) => p.isCoinbaseWallet);
            return cbProvider || null;
          }
          case 'trust': {
            const trustProvider = validProviders.find((p: any) => p.isTrust || p.isTrustWallet);
            return trustProvider || null;
          }
          case 'injected': {
            // For "injected", just return the first valid provider or fallback to window.ethereum
            return validProviders[0] || (isValidProvider(window.ethereum) ? window.ethereum : null);
          }
          default:
            return null;
        }
      }

      // Single provider scenario - check if it's valid first
      if (!isValidProvider(window.ethereum)) {
        return null;
      }

      if (walletType === 'metamask' && window.ethereum.isMetaMask) {
        return window.ethereum;
      }
      if (walletType === 'coinbase' && window.ethereum.isCoinbaseWallet) {
        return window.ethereum;
      }
      if (walletType === 'trust' && (window.ethereum.isTrust || window.ethereum.isTrustWallet)) {
        return window.ethereum;
      }
      if (walletType === 'injected') {
        return window.ethereum;
      }

      return null;
    } catch (error) {
      console.error('Error getting injected provider:', error);
      return null;
    }
  }

  /**
   * Initialize WalletConnect provider
   */
  private async initWalletConnect(): Promise<EthereumProviderType> {
    const wcProvider = await EthereumProvider.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      chains: [DEFAULT_CHAIN.chainId],
      optionalChains: [1, 137, 42161, 10], // ETH Mainnet, Polygon, Arbitrum, Optimism
      showQrModal: true,
      metadata: {
        name: 'CryptoLaunch',
        description: 'Professional Token Launchpad Platform',
        url: window.location.origin,
        icons: [`${window.location.origin}/icon-192x192.png`],
      },
    });

    return wcProvider;
  }

  /**
   * Connect wallet with specified type
   */
  async connectWallet(walletType: WalletType = 'metamask'): Promise<string | null> {
    try {
      useWalletStore.getState().setConnecting(true);

      let rawProvider: any;
      let address: string;

      if (walletType === 'walletconnect') {
        // Initialize and connect WalletConnect
        try {
          const wcProvider = await this.initWalletConnect();
          await wcProvider.enable();
          
          rawProvider = wcProvider;
          this.state.wcProvider = wcProvider;
          
          const accounts = wcProvider.accounts;
          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
          }
          address = accounts[0];

          // Setup WalletConnect listeners
          this.setupWalletConnectListeners(wcProvider);
        } catch (wcError: any) {
          console.error('WalletConnect error:', wcError);
          throw new Error(wcError.message || 'Failed to connect with WalletConnect');
        }
      } else {
        // Use injected provider (MetaMask, Coinbase, Trust, etc.)
        rawProvider = this.getInjectedProvider(walletType);

        if (!rawProvider) {
          const walletNames: Record<WalletType, string> = {
            metamask: 'MetaMask',
            walletconnect: 'WalletConnect',
            coinbase: 'Coinbase Wallet',
            trust: 'Trust Wallet',
            injected: 'a Web3 wallet',
          };
          toast.error(`Please install ${walletNames[walletType]} to continue`);
          useWalletStore.getState().setConnecting(false);
          return null;
        }

        try {
          const accounts = await rawProvider.request({
            method: 'eth_requestAccounts',
          });

          if (!accounts || accounts.length === 0) {
            throw new Error('No accounts found');
          }
          address = accounts[0];
        } catch (reqError: any) {
          console.error('Provider request error:', reqError);
          // Check if it's a specific wallet error
          if (reqError.message?.includes('Unexpected error')) {
            throw new Error('Wallet extension error. Try refreshing the page or using a different wallet.');
          }
          throw reqError;
        }

        // Setup injected provider listeners
        this.setupInjectedListeners(rawProvider);
      }

      // Create ethers provider
      const provider = new BrowserProvider(rawProvider);
      this.state.provider = provider;
      this.state.rawProvider = rawProvider;
      this.state.walletType = walletType;

      // Get network and balance
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const balance = await this.getBalance(address);

      // Switch to correct network if needed
      if (chainId !== DEFAULT_CHAIN.chainId) {
        const switched = await this.switchNetwork();
        if (!switched) {
          toast.error(`Please switch to ${DEFAULT_CHAIN.name} network`);
        }
      }

      // Update store
      useWalletStore.getState().setAddress(address);
      useWalletStore.getState().setChainId(chainId);
      useWalletStore.getState().setBalance(balance);
      useWalletStore.getState().setConnected(true);
      useWalletStore.getState().setConnecting(false);

      toast.success('Wallet connected successfully');
      return address;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      useWalletStore.getState().setConnecting(false);

      // Handle specific errors
      if (error.code === 4001 || error.message?.includes('rejected')) {
        toast.error('Connection request rejected');
      } else if (error.code === -32002) {
        toast.error('Connection pending. Check your wallet.');
      } else if (error.message?.includes('Unexpected error')) {
        toast.error('Wallet extension error. Try refreshing or use a different wallet.');
      } else {
        toast.error(error.message || 'Failed to connect wallet');
      }
      
      return null;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    try {
      // Disconnect WalletConnect if active
      if (this.state.wcProvider) {
        await this.state.wcProvider.disconnect();
      }

      // Remove listeners
      this.removeAllListeners();

      // Reset state
      this.state = {
        provider: null,
        rawProvider: null,
        walletType: null,
        wcProvider: null,
      };

      // Clear store
      useWalletStore.getState().disconnect();
      
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
      // Force clear anyway
      useWalletStore.getState().disconnect();
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(address: string): Promise<string> {
    try {
      if (!this.state.provider) {
        return '0';
      }
      const balance = await this.state.provider.getBalance(address);
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  /**
   * Switch to the correct network
   */
  async switchNetwork(): Promise<boolean> {
    const provider = this.state.rawProvider;
    if (!provider) return false;

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainId }],
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, try to add it
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [CHAIN_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast.error('Failed to add network');
          return false;
        }
      }
      console.error('Error switching network:', error);
      return false;
    }
  }

  /**
   * Get signer for transactions
   */
  async getSigner(): Promise<JsonRpcSigner | null> {
    if (!this.state.provider) {
      throw new Error('Wallet not connected');
    }
    return this.state.provider.getSigner();
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(to: string, value: string): Promise<string> {
    if (!this.state.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = await this.state.provider.getSigner();
      const gasEstimate = await signer.estimateGas({
        to,
        value: parseEther(value),
      });

      const feeData = await this.state.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      const gasCost = gasEstimate * gasPrice;

      return formatEther(gasCost);
    } catch (error) {
      console.error('Error estimating gas:', error);
      return '0.001';
    }
  }

  /**
   * Send a transaction
   */
  async sendTransaction(to: string, value: string): Promise<string> {
    if (!this.state.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = await this.state.provider.getSigner();
      const tx = await signer.sendTransaction({
        to,
        value: parseEther(value),
      });

      toast.success('Transaction submitted');
      
      const receipt = await tx.wait();
      if (receipt?.status === 1) {
        toast.success('Transaction confirmed');
      }

      return tx.hash;
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected');
      } else {
        toast.error(error.message || 'Transaction failed');
      }
      throw error;
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    if (!this.state.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const signer = await this.state.provider.getSigner();
      return await signer.signMessage(message);
    } catch (error: any) {
      if (error.code === 4001) {
        toast.error('Signature rejected');
      }
      throw error;
    }
  }

  /**
   * Check for existing connection on page load
   */
  async checkConnection(): Promise<void> {
    // Check for WalletConnect session
    try {
      const wcSessionKey = Object.keys(localStorage).find(key => 
        key.startsWith('wc@2:')
      );
      
      if (wcSessionKey) {
        // Attempt to restore WalletConnect session
        const wcProvider = await this.initWalletConnect();
        if (wcProvider.session) {
          await this.restoreWalletConnect(wcProvider);
          return;
        }
      }
    } catch (error) {
      console.log('No WalletConnect session to restore');
    }

    // Check for injected provider using our safe detection
    const injectedProvider = this.getInjectedProvider('injected');
    if (!injectedProvider) return;

    try {
      const accounts = await injectedProvider.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        const provider = new BrowserProvider(injectedProvider);
        this.state.provider = provider;
        this.state.rawProvider = injectedProvider;

        // Detect wallet type
        if (injectedProvider.isMetaMask) {
          this.state.walletType = 'metamask';
        } else if (injectedProvider.isCoinbaseWallet) {
          this.state.walletType = 'coinbase';
        } else if (injectedProvider.isTrust) {
          this.state.walletType = 'trust';
        } else {
          this.state.walletType = 'injected';
        }

        const address = accounts[0];
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        const balance = await this.getBalance(address);

        useWalletStore.getState().setAddress(address);
        useWalletStore.getState().setChainId(chainId);
        useWalletStore.getState().setBalance(balance);
        useWalletStore.getState().setConnected(true);

        this.setupInjectedListeners(injectedProvider);
      }
    } catch (error) {
      // Silently handle errors from problematic extensions
      console.log('Could not check existing connection:', error);
    }
  }

  /**
   * Restore WalletConnect session
   */
  private async restoreWalletConnect(wcProvider: EthereumProviderType): Promise<void> {
    try {
      const accounts = wcProvider.accounts;
      if (accounts.length === 0) return;

      const provider = new BrowserProvider(wcProvider);
      this.state.provider = provider;
      this.state.rawProvider = wcProvider;
      this.state.wcProvider = wcProvider;
      this.state.walletType = 'walletconnect';

      const address = accounts[0];
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      const balance = await this.getBalance(address);

      useWalletStore.getState().setAddress(address);
      useWalletStore.getState().setChainId(chainId);
      useWalletStore.getState().setBalance(balance);
      useWalletStore.getState().setConnected(true);

      this.setupWalletConnectListeners(wcProvider);
    } catch (error) {
      console.error('Error restoring WalletConnect:', error);
    }
  }

  /**
   * Setup listeners for injected providers
   */
  private setupInjectedListeners(provider: any): void {
    provider.on('accountsChanged', this.handleAccountsChanged);
    provider.on('chainChanged', this.handleChainChanged);
    provider.on('disconnect', this.handleDisconnect);
  }

  /**
   * Setup listeners for WalletConnect
   */
  private setupWalletConnectListeners(wcProvider: EthereumProviderType): void {
    wcProvider.on('accountsChanged', this.handleAccountsChanged);
    wcProvider.on('chainChanged', this.handleChainChanged);
    wcProvider.on('disconnect', this.handleDisconnect);
    wcProvider.on('session_delete', this.handleDisconnect);
  }

  /**
   * Remove all event listeners
   */
  private removeAllListeners(): void {
    if (this.state.rawProvider) {
      try {
        this.state.rawProvider.removeListener('accountsChanged', this.handleAccountsChanged);
        this.state.rawProvider.removeListener('chainChanged', this.handleChainChanged);
        this.state.rawProvider.removeListener('disconnect', this.handleDisconnect);
      } catch (e) {
        // Ignore
      }
    }
  }

  /**
   * Handle accounts changed event
   */
  private handleAccountsChanged = async (accounts: string[]): Promise<void> => {
    if (!accounts || accounts.length === 0) {
      await this.disconnectWallet();
    } else {
      const address = accounts[0];
      const balance = await this.getBalance(address);
      useWalletStore.getState().setAddress(address);
      useWalletStore.getState().setBalance(balance);
      toast('Account changed');
    }
  };

  /**
   * Handle chain changed event
   */
  private handleChainChanged = (): void => {
    window.location.reload();
  };

  /**
   * Handle disconnect event
   */
  private handleDisconnect = (): void => {
    this.disconnectWallet();
  };

  /**
   * Get current wallet type
   */
  getWalletType(): WalletType | null {
    return this.state.walletType;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!this.state.provider && !!useWalletStore.getState().address;
  }
}

export const web3Service = new Web3Service();
