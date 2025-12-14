import { getContractAddresses, ContractAddresses } from './addresses';
import { HARDHAT_ADDRESSES, HARDHAT_CHAIN_ID } from './addresses.hardhat';

/**
 * Resolve addresses for a chain. If chainId matches the hardhat chain id, return
 * the auto-generated hardhat addresses so local dev can use them automatically.
 */
export function resolveAddresses(chainId: number): ContractAddresses | null {
  if (chainId === (HARDHAT_CHAIN_ID as number)) {
    return HARDHAT_ADDRESSES as unknown as ContractAddresses;
  }

  return getContractAddresses(chainId);
}

export default resolveAddresses;
