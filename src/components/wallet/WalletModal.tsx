import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | 'trust' | 'injected';

interface WalletOption {
  id: WalletType;
  name: string;
  icon: React.ReactNode;
  description: string;
  installed?: boolean;
  popular?: boolean;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWallet: (walletType: WalletType) => Promise<void>;
  isConnecting: boolean;
}

const MetaMaskIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35.5 3L21.5 13.5L24 7.5L35.5 3Z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.5 3L18.35 13.6L16 7.5L4.5 3Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30.5 27.5L27 33L34.5 35.5L37 27.65L30.5 27.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 27.65L5.5 35.5L13 33L9.5 27.5L3 27.65Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.5 17.5L10 21.5L17.5 21.85L17.2 13.85L12.5 17.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M27.5 17.5L22.7 13.7L22.5 21.85L30 21.5L27.5 17.5Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 33L17 31L13.5 27.7L13 33Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 31L27 33L26.5 27.7L23 31Z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M27 33L23 31L23.35 34.15L23.3 35.35L27 33Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 33L16.7 35.35L16.65 34.15L17 31L13 33Z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16.75 26L13.4 25.1L15.8 24.1L16.75 26Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23.25 26L24.2 24.1L26.6 25.1L23.25 26Z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 33L13.55 27.5L9.5 27.65L13 33Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26.45 27.5L27 33L30.5 27.65L26.45 27.5Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30 21.5L22.5 21.85L23.25 26L24.2 24.1L26.6 25.1L30 21.5Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.4 25.1L15.8 24.1L16.75 26L17.5 21.85L10 21.5L13.4 25.1Z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 21.5L13.5 27.7L13.4 25.1L10 21.5Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M26.6 25.1L26.5 27.7L30 21.5L26.6 25.1Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17.5 21.85L16.75 26L17.7 30.85L17.9 24.5L17.5 21.85Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.5 21.85L22.1 24.5L22.3 30.85L23.25 26L22.5 21.85Z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23.25 26L22.3 30.85L23 31L26.5 27.7L26.6 25.1L23.25 26Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13.4 25.1L13.5 27.7L17 31L17.7 30.85L16.75 26L13.4 25.1Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23.3 35.35L23.35 34.15L23 33.85H17L16.65 34.15L16.7 35.35L13 33L14.3 34.1L16.95 36H23.05L25.7 34.1L27 33L23.3 35.35Z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 31L22.3 30.85H17.7L17 31L16.65 34.15L17 33.85H23L23.35 34.15L23 31Z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M36.1 14.35L37.5 8L35.5 3L23 12.35L27.5 17.5L34.3 19.6L36.2 17.35L35.35 16.75L36.7 15.5L35.65 14.7L37 13.65L36.1 14.35Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 8L3.9 14.35L2.95 13.65L4.35 14.7L3.3 15.5L4.65 16.75L3.8 17.35L5.7 19.6L12.5 17.5L17 12.35L4.5 3L2.5 8Z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M34.3 19.6L27.5 17.5L30 21.5L26.5 27.7L30.5 27.65H37L34.3 19.6Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.5 17.5L5.7 19.6L3 27.65H9.5L13.5 27.7L10 21.5L12.5 17.5Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22.5 21.85L23 12.35L24 7.5H16L17 12.35L17.5 21.85L17.7 24.5L17.7 30.85H22.3L22.3 24.5L22.5 21.85Z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WalletConnectIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#3B99FC"/>
    <path d="M12.5 15.5C16.5 11.5 23.5 11.5 27.5 15.5L28 16C28.2 16.2 28.2 16.5 28 16.7L26.5 18.2C26.4 18.3 26.2 18.3 26.1 18.2L25.4 17.5C22.5 14.6 17.5 14.6 14.6 17.5L13.9 18.2C13.8 18.3 13.6 18.3 13.5 18.2L12 16.7C11.8 16.5 11.8 16.2 12 16L12.5 15.5ZM30.5 18.5L31.8 19.8C32 20 32 20.3 31.8 20.5L25.5 26.8C25.3 27 24.9 27 24.7 26.8L20.5 22.6C20.45 22.55 20.35 22.55 20.3 22.6L16.1 26.8C15.9 27 15.5 27 15.3 26.8L9 20.5C8.8 20.3 8.8 20 9 19.8L10.3 18.5C10.5 18.3 10.9 18.3 11.1 18.5L15.3 22.7C15.35 22.75 15.45 22.75 15.5 22.7L19.7 18.5C19.9 18.3 20.3 18.3 20.5 18.5L24.7 22.7C24.75 22.75 24.85 22.75 24.9 22.7L29.1 18.5C29.3 18.3 29.7 18.3 29.9 18.5L30.5 18.5Z" fill="white"/>
  </svg>
);

const CoinbaseIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#0052FF"/>
    <path d="M20 6C12.268 6 6 12.268 6 20C6 27.732 12.268 34 20 34C27.732 34 34 27.732 34 20C34 12.268 27.732 6 20 6Z" fill="#0052FF"/>
    <path d="M20 8C13.373 8 8 13.373 8 20C8 26.627 13.373 32 20 32C26.627 32 32 26.627 32 20C32 13.373 26.627 8 20 8ZM17 16H23C23.552 16 24 16.448 24 17V23C24 23.552 23.552 24 23 24H17C16.448 24 16 23.552 16 23V17C16 16.448 16.448 16 17 16Z" fill="white"/>
  </svg>
);

const TrustWalletIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#3375BB"/>
    <path d="M20 7L8 12V19C8 26.5 13 32.5 20 35C27 32.5 32 26.5 32 19V12L20 7Z" fill="white"/>
    <path d="M20 9L10 13V19C10 25.5 14.5 30.5 20 33C25.5 30.5 30 25.5 30 19V13L20 9Z" fill="#3375BB"/>
    <path d="M20 12L12 15.5V19.5C12 24.5 15.5 28.5 20 30.5C24.5 28.5 28 24.5 28 19.5V15.5L20 12Z" fill="white"/>
  </svg>
);

const InjectedIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="8" fill="#627EEA"/>
    <path d="M20 6L19.8 6.7V25.5L20 25.7L28 21.2L20 6Z" fill="white" fillOpacity="0.6"/>
    <path d="M20 6L12 21.2L20 25.7V16.5V6Z" fill="white"/>
    <path d="M20 27.5L19.9 27.6V33.7L20 34L28 23L20 27.5Z" fill="white" fillOpacity="0.6"/>
    <path d="M20 34V27.5L12 23L20 34Z" fill="white"/>
    <path d="M20 25.7L28 21.2L20 16.5V25.7Z" fill="white" fillOpacity="0.2"/>
    <path d="M12 21.2L20 25.7V16.5L12 21.2Z" fill="white" fillOpacity="0.6"/>
  </svg>
);

export const WalletModal = ({ isOpen, onClose, onSelectWallet, isConnecting }: WalletModalProps) => {
  const [selectedWallet, setSelectedWallet] = useState<WalletType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check which wallets are installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
  const isCoinbaseInstalled = typeof window !== 'undefined' && !!window.ethereum?.isCoinbaseWallet;
  const isTrustInstalled = typeof window !== 'undefined' && !!window.ethereum?.isTrust;
  const hasInjectedProvider = typeof window !== 'undefined' && !!window.ethereum;

  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: <MetaMaskIcon />,
      description: isMetaMaskInstalled ? 'Connect using MetaMask' : 'Install MetaMask to continue',
      installed: isMetaMaskInstalled,
      popular: true,
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: <WalletConnectIcon />,
      description: 'Scan with WalletConnect',
      installed: true, // WalletConnect doesn't need installation
      popular: true,
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: <CoinbaseIcon />,
      description: isCoinbaseInstalled ? 'Connect using Coinbase Wallet' : 'Install Coinbase Wallet',
      installed: isCoinbaseInstalled,
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: <TrustWalletIcon />,
      description: isTrustInstalled ? 'Connect using Trust Wallet' : 'Use WalletConnect for Trust Wallet',
      installed: isTrustInstalled,
    },
    {
      id: 'injected',
      name: 'Browser Wallet',
      icon: <InjectedIcon />,
      description: hasInjectedProvider ? 'Use your browser wallet' : 'No wallet detected',
      installed: hasInjectedProvider,
    },
  ];

  const handleSelectWallet = async (walletType: WalletType) => {
    setSelectedWallet(walletType);
    setError(null);

    try {
      await onSelectWallet(walletType);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      setSelectedWallet(null);
    }
  };

  const handleInstallWallet = (walletType: WalletType) => {
    const urls: Record<WalletType, string> = {
      metamask: 'https://metamask.io/download/',
      walletconnect: 'https://walletconnect.com/',
      coinbase: 'https://www.coinbase.com/wallet',
      trust: 'https://trustwallet.com/',
      injected: 'https://metamask.io/download/',
    };
    window.open(urls[walletType], '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect Wallet">
      <div className="space-y-4">
        <p className="text-text-secondary text-sm mb-6">
          Choose your preferred wallet to connect to CryptoLaunch
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-2">
          {walletOptions.map((wallet) => (
            <motion.button
              key={wallet.id}
              onClick={() => wallet.installed ? handleSelectWallet(wallet.id) : handleInstallWallet(wallet.id)}
              disabled={isConnecting && selectedWallet === wallet.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                selectedWallet === wallet.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
              } ${!wallet.installed ? 'opacity-70' : ''}`}
            >
              <div className="flex-shrink-0">
                {wallet.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{wallet.name}</span>
                  {wallet.popular && (
                    <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                      Popular
                    </span>
                  )}
                  {wallet.installed && wallet.id !== 'walletconnect' && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Installed
                    </span>
                  )}
                </div>
                <p className="text-text-muted text-sm">{wallet.description}</p>
              </div>
              <div className="flex-shrink-0">
                {isConnecting && selectedWallet === wallet.id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-500 border-t-transparent" />
                ) : !wallet.installed ? (
                  <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="pt-4 border-t border-white/10">
          <p className="text-text-muted text-xs text-center">
            By connecting a wallet, you agree to our{' '}
            <a href="/terms" className="text-primary-500 hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="text-primary-500 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </Modal>
  );
};
