import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { DEFAULT_CHAIN, CHAIN_CONFIG } from '@/config/web3';
import { useWalletStore } from '@/store/walletStore';
import toast from 'react-hot-toast';
import type { WalletType } from '@/components/wallet/WalletModal';

declare global {
  interface Window {
    ethereum?: any;
  }
}

class Web3Service {
  private provider: BrowserProvider | null = null;
  private currentWalletType: WalletType | null = null;

  /**
   * Get the appropriate provider based on wallet type
   */
  private getProvider(walletType: WalletType): any {
    if (!window.ethereum) {
      return null;
    }

    // Handle multiple injected providers
    const providers = window.ethereum.providers;
    
    if (providers && Array.isArray(providers)) {
      switch (walletType) {
        case 'metamask':
          return providers.find((p: any) => p.isMetaMask && !p.isCoinbaseWallet);
        case 'coinbase':
          return providers.find((p: any) => p.isCoinbaseWallet);
        case 'trust':
          return providers.find((p: any) => p.isTrust);
        default:
          return providers[0];
      }
    }

    // Single provider case
    return window.ethereum;
  }

  /**
   * Connect wallet with specified type
   */
  async connectWallet(walletType: WalletType = 'metamask'): Promise<string | null> {
    // For WalletConnect, we need to handle it differently
    if (walletType === 'walletconnect') {
      return this.connectWithWalletConnect();
    }

    const ethereumProvider = this.getProvider(walletType);

    if (!ethereumProvider) {
      const walletNames: Record<WalletType, string> = {
        metamask: 'MetaMask',
        walletconnect: 'WalletConnect',
        coinbase: 'Coinbase Wallet',
        trust: 'Trust Wallet',
        injected: 'a Web3 wallet',
      };
      toast.error(`Please install ${walletNames[walletType]} to use this feature`);
      return null;
    }

    try {
      useWalletStore.getState().setConnecting(true);
      this.currentWalletType = walletType;

      const provider = new BrowserProvider(ethereumProvider);
      this.provider = provider;

      const accounts = await ethereumProvider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      if (chainId !== DEFAULT_CHAIN.chainId) {
        await this.switchNetwork();
      }

      const balance = await this.getBalance(address);

      useWalletStore.getState().setAddress(address);
      useWalletStore.getState().setChainId(chainId);
      useWalletStore.getState().setBalance(balance);
      useWalletStore.getState().setConnected(true);
      useWalletStore.getState().setConnecting(false);

      this.setupListeners(ethereumProvider);

      toast.success('Wallet connected successfully');
      return address;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      useWalletStore.getState().setConnecting(false);
      
      // Handle specific error messages
      if (error.code === 4001) {
        toast.error('Connection request rejected');
      } else if (error.code === -32002) {
        toast.error('Connection request pending. Please check your wallet.');
      } else {
        toast.error(error.message || 'Failed to connect wallet');
      }
      return null;
    }
  }

  /**
   * Connect using WalletConnect (simplified version)
   * For full WalletConnect support, you'd need to install @walletconnect/ethereum-provider
   */
  private async connectWithWalletConnect(): Promise<string | null> {
    try {
      useWalletStore.getState().setConnecting(true);
      
      // Check if there's an existing WalletConnect session in localStorage
      // For proper WalletConnect v2 implementation, you need:
      // npm install @walletconnect/ethereum-provider @walletconnect/modal
      
      toast.error('WalletConnect requires additional setup. Please use MetaMask or another browser wallet for now.');
      
      // Placeholder for WalletConnect implementation
      // In production, you would:
      // 1. Import WalletConnectProvider from @walletconnect/ethereum-provider
      // 2. Create a new provider instance with your project ID
      // 3. Enable the provider and get accounts
      
      useWalletStore.getState().setConnecting(false);
      return null;
    } catch (error: any) {
      console.error('WalletConnect error:', error);
      useWalletStore.getState().setConnecting(false);
      toast.error('WalletConnect connection failed');
      return null;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.currentWalletType = null;
    useWalletStore.getState().disconnect();
    this.removeListeners();
    toast.success('Wallet disconnected');
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      const ethereumProvider = this.getProvider(this.currentWalletType || 'injected');
      if (ethereumProvider) {
        this.provider = new BrowserProvider(ethereumProvider);
      }
    }

    if (!this.provider) {
      return '0';
    }

    try {
      const balance = await this.provider.getBalance(address);
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async switchNetwork(): Promise<boolean> {
    const ethereumProvider = this.getProvider(this.currentWalletType || 'injected');
    if (!ethereumProvider) return false;

    try {
      await ethereumProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await ethereumProvider.request({
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
      console.error('Error switching network:', switchError);
      toast.error('Failed to switch network');
      return false;
    }
  }

  async estimateGas(to: string, value: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const signer = await this.provider.getSigner();
      const gasEstimate = await signer.estimateGas({
        to,
        value: parseEther(value),
      });

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);
      const gasCost = gasEstimate * gasPrice;

      return formatEther(gasCost);
    } catch (error) {
      console.error('Error estimating gas:', error);
      return '0.001';
    }
  }

  async sendTransaction(to: string, value: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const signer = await this.provider.getSigner();
      const tx = await signer.sendTransaction({
        to,
        value: parseEther(value),
      });

      toast.success('Transaction submitted');
      await tx.wait();
      toast.success('Transaction confirmed');

      return tx.hash;
    } catch (error: any) {
      console.error('Error sending transaction:', error);
      
      if (error.code === 4001) {
        toast.error('Transaction rejected');
      } else {
        toast.error(error.message || 'Transaction failed');
      }
      throw error;
    }
  }

  private setupListeners(ethereumProvider: any): void {
    if (!ethereumProvider) return;

    // Remove any existing listeners first to prevent duplicates
    this.removeListeners();

    ethereumProvider.on('accountsChanged', this.handleAccountsChanged.bind(this));
    ethereumProvider.on('chainChanged', this.handleChainChanged.bind(this));
    ethereumProvider.on('disconnect', this.handleDisconnect.bind(this));
  }

  private removeListeners(): void {
    const ethereumProvider = this.getProvider(this.currentWalletType || 'injected');
    if (!ethereumProvider) return;

    try {
      ethereumProvider.removeListener('accountsChanged', this.handleAccountsChanged);
      ethereumProvider.removeListener('chainChanged', this.handleChainChanged);
      ethereumProvider.removeListener('disconnect', this.handleDisconnect);
    } catch (error) {
      // Ignore errors when removing listeners
    }
  }

  private async handleAccountsChanged(accounts: string[]): Promise<void> {
    if (accounts.length === 0) {
      this.disconnectWallet();
    } else {
      const address = accounts[0];
      const balance = await this.getBalance(address);
      useWalletStore.getState().setAddress(address);
      useWalletStore.getState().setBalance(balance);
      toast('Account changed');
    }
  }

  private handleChainChanged(_chainId: string): void {
    // Reload the page to reset the state
    window.location.reload();
  }

  private handleDisconnect(): void {
    this.disconnectWallet();
  }

  async checkConnection(): Promise<void> {
    const ethereumProvider = this.getProvider('injected');
    if (!ethereumProvider) return;

    try {
      const provider = new BrowserProvider(ethereumProvider);
      this.provider = provider;

      const accounts = await ethereumProvider.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        const address = accounts[0];
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        const balance = await this.getBalance(address);

        useWalletStore.getState().setAddress(address);
        useWalletStore.getState().setChainId(chainId);
        useWalletStore.getState().setBalance(balance);
        useWalletStore.getState().setConnected(true);

        // Detect which wallet is connected
        if (ethereumProvider.isMetaMask) {
          this.currentWalletType = 'metamask';
        } else if (ethereumProvider.isCoinbaseWallet) {
          this.currentWalletType = 'coinbase';
        } else if (ethereumProvider.isTrust) {
          this.currentWalletType = 'trust';
        } else {
          this.currentWalletType = 'injected';
        }

        this.setupListeners(ethereumProvider);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  }

  /**
   * Get current wallet type
   */
  getWalletType(): WalletType | null {
    return this.currentWalletType;
  }
}

export const web3Service = new Web3Service();
