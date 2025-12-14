import { ethers } from 'ethers';
import { HARDHAT_ADDRESSES } from '../src/contracts/addresses.hardhat';
import LaunchpadFactoryJson from '../src/contracts/abis/LaunchpadFactory.json';

async function main() {
  const rpc = process.env.RPC || 'http://127.0.0.1:8545';
  const provider = new ethers.JsonRpcProvider(rpc);

  const factoryAddr = (HARDHAT_ADDRESSES as any).LAUNCHPAD_FACTORY;
  console.log('Using factory address:', factoryAddr);

  const factory = new ethers.Contract(factoryAddr, LaunchpadFactoryJson.abi, provider);

  try {
    const count = await factory.getPoolCount();
    console.log('getPoolCount ->', count.toString());
    const pools = await factory.getAllPools();
    console.log('getAllPools ->', pools.slice(0, 5));
  } catch (err: any) {
    console.error('Contract call failed:', err.message || err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
