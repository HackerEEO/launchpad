# CryptoLaunch Smart Contracts

Solidity smart contracts for the CryptoLaunch IDO platform built with Hardhat.

## Contracts

### Core Contracts

| Contract | Description |
|----------|-------------|
| `IDOPool.sol` | Core IDO sale contract with investment, claiming, and refund logic |
| `TokenVesting.sol` | Token vesting with TGE unlock, cliff, and linear vesting |
| `LaunchpadFactory.sol` | Factory for deploying and managing IDO pools |
| `Whitelist.sol` | KYC/whitelist management with batch operations |

### Mock Contracts (Testing)

| Contract | Description |
|----------|-------------|
| `MockERC20.sol` | Mock ERC20 token with faucet for testing |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
cd contracts
npm install
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Run Tests with Coverage

```bash
npx hardhat coverage
```

### Run Tests with Gas Report

```bash
REPORT_GAS=true npx hardhat test
```

## Deployment

### 1. Configure Environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:
- `PRIVATE_KEY`: Deployer wallet private key (without 0x prefix)
- `SEPOLIA_RPC_URL`: Sepolia RPC endpoint
- `ETHERSCAN_API_KEY`: For contract verification

### 2. Deploy to Sepolia (Testnet)

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

### 3. Deploy to Mainnet

⚠️ **WARNING: This deploys to mainnet with real ETH!**

```bash
npx hardhat run scripts/deploy.ts --network mainnet
```

### 4. Create Sample Pool (Testnet)

```bash
npx hardhat run scripts/create-sample-pool.ts --network sepolia
```

## Contract Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LaunchpadFactory                         │
│  - Creates new IDO pools                                    │
│  - Tracks all pools                                         │
│  - Platform fee management                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ deploys
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        IDOPool                              │
│  - Handles investments (ETH)                                │
│  - Token distribution                                       │
│  - Built-in vesting (TGE + cliff + linear)                  │
│  - Refunds if soft cap not met                              │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐        ┌──────────────────────┐
│      Whitelist       │        │    TokenVesting      │
│  - KYC verification  │        │  - Standalone vesting│
│  - Batch operations  │        │  - Revocable option  │
└──────────────────────┘        └──────────────────────┘
```

## IDOPool Flow

### Investment Phase

1. Admin creates pool via `LaunchpadFactory.createPool()`
2. Admin transfers sale tokens to pool
3. Whitelisted users call `invest()` with ETH
4. Sale runs until `endTime` or `hardCap` reached

### Post-Sale Phase

If **soft cap reached**:
1. Admin calls `finalize()`
2. Users call `claim()` to receive tokens
3. TGE tokens released immediately
4. Remaining tokens vest over cliff + vesting period

If **soft cap NOT reached**:
1. Admin calls `finalize()`
2. Users call `refund()` to get ETH back

## TokenVesting Features

- **TGE (Token Generation Event)**: Immediate unlock percentage
- **Cliff Period**: Lock period before vesting starts
- **Linear Vesting**: Gradual token release after cliff
- **Revocable**: Owner can revoke (if enabled)
- **Transferable**: Beneficiary can transfer to new address

## Gas Optimization

Contracts use:
- Custom errors instead of require strings
- Packed struct storage
- Efficient loops with unchecked increments
- View functions for read operations

## Security Features

- **ReentrancyGuard**: All state-changing functions protected
- **Ownable**: Admin functions restricted
- **SafeERC20**: Safe token transfers
- **Input Validation**: Comprehensive checks on all inputs

## Auditing Checklist

Before mainnet deployment:

- [ ] Professional smart contract audit
- [ ] Internal code review
- [ ] Testnet deployment and testing
- [ ] Edge case testing
- [ ] Gas optimization review
- [ ] Access control verification
- [ ] Upgrade path consideration

## Frontend Integration

After deployment, update the frontend:

1. Copy ABIs from `artifacts/` to `src/contracts/abis/`
2. Update addresses in `src/contracts/addresses.ts`
3. Use hooks in React components:

```typescript
import { useIDOPool, useVesting, useLaunchpadFactory } from '@/contracts';

// In component
const { invest, claim, getPoolInfo } = useIDOPool();
const { release, getSchedule } = useVesting();
const { getAllPools, getPoolDetails } = useLaunchpadFactory();
```

## Network Configuration

| Network | Chain ID | Explorer |
|---------|----------|----------|
| Ethereum Mainnet | 1 | etherscan.io |
| Sepolia Testnet | 11155111 | sepolia.etherscan.io |
| Arbitrum One | 42161 | arbiscan.io |
| Polygon | 137 | polygonscan.com |

## License

MIT License - see LICENSE file for details.
