# 📚 CryptoLaunch Complete Documentation Index

Welcome to the complete documentation for the CryptoLaunch IDO Launchpad platform! This index provides quick access to all documentation files.

---

## 🎯 Documentation Status

✅ **COMPLETE** - Ready to use  
🚧 **IN PROGRESS** - Being updated  
📝 **PLANNED** - Coming soon

---

## 📖 Available Documentation

### 🚀 Getting Started (Beginners Start Here!)

| Document | Status | Description |
|----------|--------|-------------|
| [README.md](./README.md) | ✅ | Project overview and quick start |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | ✅ | Complete setup from zero to running |
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | ✅ | All `.env` variables explained |

### 🏛️ Understanding the System

| Document | Status | Description |
|----------|--------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | ✅ | System design and component interactions |
| [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) | ✅ | Every file and folder explained |
| [SMART_CONTRACTS.md](./SMART_CONTRACTS.md) | ✅ | Contract guide (see below) |

### 🔧 Development & Deployment

| Document | Status | Description |
|----------|--------|-------------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | ✅ | Production deployment (see below) |
| [BEST_PRACTICES.md](./BEST_PRACTICES.md) | ✅ | Coding standards and tips (see below) |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | ✅ | Common issues and solutions (see below) |

### 🔐 Security & Compliance

| Document | Status | Description |
|----------|--------|-------------|
| [SECURITY.md](../SECURITY.md) | 📝 | Security checklist |
| [KYC.md](../docs/KYC.md) | ✅ | KYC/Compliance system |
| [PRODUCTION_AUDIT_REPORT.md](../PRODUCTION_AUDIT_REPORT.md) | ✅ | Security audit findings |

---

## 🎓 Learning Path

### For Complete Beginners

1. **Start**: [README.md](./README.md) - Understand what CryptoLaunch is
2. **Setup**: [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Get it running locally
3. **Explore**: [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Learn the codebase
4. **Understand**: [ARCHITECTURE.md](./ARCHITECTURE.md) - How it all works together

### For Developers

1. **Setup**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. **Environment**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
3. **Contracts**: [SMART_CONTRACTS.md](./SMART_CONTRACTS.md)
4. **Best Practices**: [BEST_PRACTICES.md](./BEST_PRACTICES.md)
5. **Deploy**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### For Deploying to Production

1. **Security Audit**: [PRODUCTION_AUDIT_REPORT.md](../PRODUCTION_AUDIT_REPORT.md)
2. **Fix Critical Issues**: [CRITICAL_FIXES.md](../CRITICAL_FIXES.md)
3. **Deployment**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
4. **Monitor**: Follow production checklist

---

## 📚 Additional Comprehensive Guides

The following sections provide complete guides that were consolidated for accessibility:

---

# 🔗 SMART_CONTRACTS.md - Smart Contract Integration Guide

## Complete Guide to Smart Contracts

### Overview

The CryptoLaunch platform uses 4 main smart contracts:

1. **LaunchpadFactory** - Creates new IDO pools
2. **IDOPool** - Manages individual token sales
3. **TokenVesting** - Controls token release schedules
4. **Whitelist** - Tier-based access control

---

### Contract Compilation

```bash
cd contracts

# Compile all contracts
npx hardhat compile

# Output appears in:
# - artifacts/ - Compiled contracts and ABIs
# - cache/ - Compilation cache

# Successful output:
# Compiled 10 Solidity files successfully
```

---

### Contract Deployment

#### Step 1: Configure Network

Edit `contracts/hardhat.config.ts`:

```typescript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 11155111,
  },
}
```

#### Step 2: Deploy to Testnet

```bash
npx hardhat run scripts/deploy.ts --network sepolia

# Wait 2-3 minutes...
# Output:
# Deploying contracts...
# LaunchpadFactory deployed to: 0x1234...
# Whitelist deployed to: 0x5678...
# TokenVesting deployed to: 0x9abc...
```

#### Step 3: Save Addresses

Copy addresses to `.env`:

```bash
VITE_FACTORY_ADDRESS=0x1234...
VITE_WHITELIST_ADDRESS=0x5678...
VITE_VESTING_ADDRESS=0x9abc...
```

---

### ABI Integration

#### Generate ABIs

ABIs are generated automatically during compilation:

```bash
# Location after compile:
contracts/artifacts/contracts/IDOPool.sol/IDOPool.json
```

#### Copy to Frontend

```bash
# Create directory
mkdir -p src/contracts/abis

# Copy ABI files
cp contracts/artifacts/contracts/LaunchpadFactory.sol/LaunchpadFactory.json src/contracts/abis/
cp contracts/artifacts/contracts/IDOPool.sol/IDOPool.json src/contracts/abis/
cp contracts/artifacts/contracts/TokenVesting.sol/TokenVesting.json src/contracts/abis/
cp contracts/artifacts/contracts/Whitelist.sol/Whitelist.json src/contracts/abis/
```

#### Import in Code

```typescript
// src/contracts/abis/index.ts
import IDOPoolArtifact from './IDOPool.json';

export const IDO_POOL_ABI = IDOPoolArtifact.abi;
```

---

### Frontend Integration

#### Create Contract Instance

```typescript
import { Contract } from 'ethers';
import { IDO_POOL_ABI } from '@/contracts/abis';
import { web3Service } from '@/lib/web3';

const pool = new Contract(
  poolAddress,
  IDO_POOL_ABI,
  await web3Service.getSigner()
);
```

#### Call Contract Functions

```typescript
// Read function (no gas)
const tokenPrice = await pool.tokenPrice();

// Write function (costs gas, requires signature)
const tx = await pool.invest({ value: ethers.parseEther('1.0') });
await tx.wait(); // Wait for confirmation
```

---

### Contract Verification

```bash
npx hardhat verify --network sepolia 0x1234... # Factory address

# View on Etherscan:
# https://sepolia.etherscan.io/address/0x1234...
```

---

# 🚀 DEPLOYMENT_GUIDE.md - Production Deployment Guide

## Complete Production Deployment

### ⚠️ Before Deploying to Mainnet

**DO NOT deploy until**:

- [ ] External security audit completed
- [ ] All critical vulnerabilities fixed
- [ ] Multi-signature wallet implemented
- [ ] Timelock controller added
- [ ] Monitoring and alerting operational
- [ ] Legal review completed

See: [PRODUCTION_AUDIT_REPORT.md](../PRODUCTION_AUDIT_REPORT.md)

---

### Deployment Checklist

#### Phase 1: Preparation (1 week)

- [ ] Complete code review
- [ ] Fix all critical and high severity issues
- [ ] Write comprehensive tests (>90% coverage)
- [ ] Run fuzz tests
- [ ] Perform gas optimization
- [ ] Update documentation

#### Phase 2: Contract Deployment (1 day)

- [ ] Deploy to testnet for final testing
- [ ] Test all functions thoroughly
- [ ] Deploy to mainnet
- [ ] Verify contracts on Etherscan
- [ ] Transfer ownership to multi-sig
- [ ] Add timelock

#### Phase 3: Frontend Deployment (1 day)

- [ ] Build production bundle
- [ ] Configure environment variables
- [ ] Deploy to Vercel/Netlify
- [ ] Test all features on production
- [ ] Set up monitoring (Sentry)

#### Phase 4: Backend Deployment (1 day)

- [ ] Deploy Supabase edge functions
- [ ] Configure production database
- [ ] Set up backups
- [ ] Enable rate limiting
- [ ] Configure CORS

---

### Frontend Deployment (Vercel)

#### Step 1: Build Production Bundle

```bash
npm run build

# Output in dist/
# Check for errors
```

#### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Connect GitHub repo
# - Configure build settings
# - Add environment variables

# Production deploy
vercel --prod
```

#### Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Project Settings → Environment Variables
2. Add all `VITE_*` variables
3. Use production values (mainnet addresses)

---

### Backend Deployment (Supabase)

#### Step 1: Create Production Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create new project
3. Choose region (closest to users)
4. Note project URL and keys

#### Step 2: Run Migrations

```bash
npx supabase link --project-ref your-prod-project-id
npx supabase db push
```

#### Step 3: Deploy Edge Functions

```bash
npx supabase functions deploy process-investment
npx supabase functions deploy claim-tokens
npx supabase functions deploy kyc-webhook
npx supabase functions deploy kyc-create-session
```

#### Step 4: Set Secrets

```bash
npx supabase secrets set SUMSUB_APP_TOKEN="prd:..."
npx supabase secrets set SUMSUB_SECRET_KEY="prdsec:..."
```

---

### Contract Deployment (Mainnet)

#### Step 1: Prepare Deployment Wallet

```bash
# Create new wallet with hardware wallet (Ledger/Trezor)
# Fund with ETH for gas (estimate: 0.5 ETH)
```

#### Step 2: Deploy Contracts

```bash
cd contracts

# Final check
npm test

# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network mainnet

# Save all addresses immediately
```

#### Step 3: Verify on Etherscan

```bash
npx hardhat verify --network mainnet 0x... # Factory
npx hardhat verify --network mainnet 0x... # Whitelist
npx hardhat verify --network mainnet 0x... # Vesting
```

#### Step 4: Transfer Ownership

```bash
# Transfer to multi-sig wallet (Gnosis Safe)
# NEVER leave contracts owned by single EOA in production
```

---

### Post-Deployment

#### Monitoring

```bash
# Set up Sentry for error tracking
npm install @sentry/react

# Configure in src/main.tsx
```

#### Backups

```bash
# Schedule daily database backups
# Supabase provides automatic backups
# Download weekly for redundancy
```

---

# 📖 BEST_PRACTICES.md - Development Best Practices

## Coding Standards

### TypeScript

```typescript
// ✅ GOOD: Explicit types
interface Project {
  id: string;
  name: string;
}

function getProject(id: string): Project | null {
  // ...
}

// ❌ BAD: Implicit any
function getProject(id) {
  // ...
}
```

### React Components

```typescript
// ✅ GOOD: Functional components with TypeScript
interface Props {
  project: Project;
  onInvest: (amount: number) => void;
}

export const ProjectCard: React.FC<Props> = ({ project, onInvest }) => {
  // ...
};

// ❌ BAD: Class components, missing types
export class ProjectCard extends React.Component {
  // ...
}
```

---

### Smart Contracts

```solidity
// ✅ GOOD: Access control, validation
function invest() external payable nonReentrant {
    require(block.timestamp >= startTime, "Sale not started");
    require(msg.value > 0, "Invalid amount");
    // ...
}

// ❌ BAD: No checks
function invest() external payable {
    // ...
}
```

---

## Security Practices

### Never Trust User Input

```typescript
// ✅ GOOD: Validate everything
function invest(amount: string) {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error('Invalid amount');
  }
  // ...
}

// ❌ BAD: Trust input
function invest(amount: string) {
  const tx = await pool.invest({ value: amount });
}
```

---

### Wait for Confirmations

```typescript
// ✅ GOOD: Wait for confirmations
const tx = await pool.invest({ value: ethers.parseEther('1.0') });
const receipt = await tx.wait(2); // 2 block confirmations
if (receipt.status !== 1) {
  throw new Error('Transaction failed');
}

// ❌ BAD: Don't wait
const tx = await pool.invest({ value: ethers.parseEther('1.0') });
// Assume success (WRONG!)
```

---

## Git Workflow

```bash
# ✅ GOOD: Feature branches
git checkout -b feature/add-vesting
# Make changes
git commit -m "feat: add vesting schedule display"
git push origin feature/add-vesting
# Create pull request

# ❌ BAD: Commit directly to main
git checkout main
git commit -m "changes"
git push
```

---

# 🐛 TROUBLESHOOTING.md - Common Issues and Solutions

## Frontend Issues

### Issue: "Cannot find module '@/components/...'"

**Cause**: TypeScript path alias not recognized

**Solution**:
```bash
# Restart VS Code TypeScript server
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or restart dev server
npm run dev
```

---

### Issue: MetaMask not connecting

**Cause**: Wrong network or MetaMask locked

**Solution**:
1. Check MetaMask is unlocked
2. Switch to Sepolia network
3. Refresh page
4. Clear browser cache

---

### Issue: "Transaction reverted"

**Cause**: Contract validation failed

**Check**:
- Are you whitelisted?
- Is sale live (between start/end time)?
- Do you have enough ETH?
- Is hard cap reached?

**Solution**:
```typescript
// Check contract state first
const isWhitelisted = await whitelist.isWhitelisted(address);
const saleEnded = await pool.hasEnded();
```

---

## Contract Issues

### Issue: "Insufficient funds for gas"

**Cause**: Not enough ETH in wallet

**Solution**:
```bash
# Get test ETH from faucet
# https://sepoliafaucet.com/
```

---

### Issue: "Nonce too high"

**Cause**: MetaMask nonce out of sync

**Solution**:
1. MetaMask → Settings → Advanced
2. Clear activity tab data
3. Reset account

---

## Database Issues

### Issue: "Row Level Security policy violation"

**Cause**: User trying to access unauthorized data

**Solution**:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'investments';

-- Verify user has correct role
SELECT current_user_wallet();
```

---

### Issue: Real-time subscriptions not working

**Cause**: Not subscribed to channel

**Solution**:
```typescript
// Verify subscription
const subscription = supabase
  .channel('investments-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'investments'
  }, (payload) => {
    console.log('Change:', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

---

## Build Issues

### Issue: "Module not found: Can't resolve 'ethers'"

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: Build fails with TypeScript errors

**Solution**:
```bash
# Check TypeScript version
npm list typescript

# Update if needed
npm install -D typescript@latest

# Clean build
rm -rf dist
npm run build
```

---

**For more help**: Create a GitHub issue with:
- Error message (full stack trace)
- Steps to reproduce
- Environment (OS, Node version, browser)
- What you've tried

---

## 📞 Getting Help

If you encounter issues not covered here:

1. **Search Documentation**: Use Ctrl+F in docs
2. **Check GitHub Issues**: Someone may have had the same problem
3. **Create New Issue**: Include error details, environment info
4. **Join Community**: Discord/Telegram (if available)

---

## 🎯 Summary

You now have access to **complete, beginner-friendly documentation** covering:

✅ **What the codebase does** - README.md, ARCHITECTURE.md  
✅ **Complete folder/file explanations** - FOLDER_STRUCTURE.md  
✅ **Setup from zero** - SETUP_GUIDE.md  
✅ **Deployment guide** - DEPLOYMENT_GUIDE.md (above)  
✅ **Environment variables** - ENVIRONMENT_VARIABLES.md  
✅ **Smart contract integration** - SMART_CONTRACTS.md (above)  
✅ **Best practices** - BEST_PRACTICES.md (above)  
✅ **Troubleshooting** - TROUBLESHOOTING.md (above)

---

**Ready to build? Start with [SETUP_GUIDE.md](./SETUP_GUIDE.md)! 🚀**
