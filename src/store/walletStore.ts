import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletState } from '@/types';

interface WalletStore extends WalletState {
  setAddress: (address: string | null) => void;
  setBalance: (balance: string) => void;
  setChainId: (chainId: number | null) => void;
  setConnecting: (isConnecting: boolean) => void;
  setConnected: (isConnected: boolean) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      address: null,
      balance: '0',
      chainId: null,
      isConnecting: false,
      isConnected: false,
      setAddress: (address) => set({ address }),
      setBalance: (balance) => set({ balance }),
      setChainId: (chainId) => set({ chainId }),
      setConnecting: (isConnecting) => set({ isConnecting }),
      setConnected: (isConnected) => set({ isConnected }),
      disconnect: () =>
        set({
          address: null,
          balance: '0',
          chainId: null,
          isConnected: false,
          isConnecting: false,
        }),
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        address: state.address,
        chainId: state.chainId,
      }),
    }
  )
);
