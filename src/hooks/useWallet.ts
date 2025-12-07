import { useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { web3Service } from '@/lib/web3';
import { usersService } from '@/services/users.service';
import { useAppStore } from '@/store/appStore';

export const useWallet = () => {
  const {
    address,
    balance,
    chainId,
    isConnecting,
    isConnected,
  } = useWalletStore();

  const { setIsAdmin, setCurrentUser } = useAppStore();

  useEffect(() => {
    web3Service.checkConnection();
  }, []);

  useEffect(() => {
    if (address) {
      usersService.getOrCreate(address).then((user) => {
        setCurrentUser({ wallet: address, email: user.email || undefined });
        setIsAdmin(user.is_admin);
      });
    } else {
      setCurrentUser(null);
      setIsAdmin(false);
    }
  }, [address, setIsAdmin, setCurrentUser]);

  const connect = async () => {
    await web3Service.connectWallet();
  };

  const disconnect = async () => {
    await web3Service.disconnectWallet();
  };

  const switchNetwork = async () => {
    return await web3Service.switchNetwork();
  };

  const getBalance = async (addr: string) => {
    return await web3Service.getBalance(addr);
  };

  const estimateGas = async (to: string, value: string) => {
    return await web3Service.estimateGas(to, value);
  };

  const sendTransaction = async (to: string, value: string) => {
    return await web3Service.sendTransaction(to, value);
  };

  return {
    address,
    balance,
    chainId,
    isConnecting,
    isConnected,
    connect,
    disconnect,
    switchNetwork,
    getBalance,
    estimateGas,
    sendTransaction,
  };
};
