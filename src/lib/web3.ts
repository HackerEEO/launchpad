import { BrowserProvider, formatEther, parseEther } from 'ethers';
import { DEFAULT_CHAIN, CHAIN_CONFIG } from '@/config/web3';
import { useWalletStore } from '@/store/walletStore';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    ethereum?: any;
  }
}

class Web3Service {
  private provider: BrowserProvider | null = null;

  async connectWallet(): Promise<string | null> {
    if (!window.ethereum) {
      toast.error('Please install MetaMask to use this feature');
      return null;
    }

    try {
      useWalletStore.getState().setConnecting(true);

      const provider = new BrowserProvider(window.ethereum);
      this.provider = provider;

      const accounts = await window.ethereum.request({
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

      this.setupListeners();

      toast.success('Wallet connected successfully');
      return address;
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      useWalletStore.getState().setConnecting(false);
      toast.error(error.message || 'Failed to connect wallet');
      return null;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    useWalletStore.getState().disconnect();
    this.removeListeners();
    toast.success('Wallet disconnected');
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) {
      const provider = new BrowserProvider(window.ethereum);
      this.provider = provider;
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
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: CHAIN_CONFIG.chainId }],
      });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
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
      toast.error(error.message || 'Transaction failed');
      throw error;
    }
  }

  private setupListeners(): void {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
    window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
    window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
  }

  private removeListeners(): void {
    if (!window.ethereum) return;

    window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', this.handleChainChanged);
    window.ethereum.removeListener('disconnect', this.handleDisconnect);
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
    window.location.reload();
  }

  private handleDisconnect(): void {
    this.disconnectWallet();
  }

  async checkConnection(): Promise<void> {
    if (!window.ethereum) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      this.provider = provider;

      const accounts = await window.ethereum.request({
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

        this.setupListeners();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  }
}

export const web3Service = new Web3Service();
