# 🚀 Complete Setup Guide

This guide will take you from **zero to running locally** in about 30 minutes. Perfect for beginners setting up their development environment for the first time.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Smart Contract Setup](#smart-contract-setup)
7. [Frontend Setup](#frontend-setup)
8. [Running the Application](#running-the-application)
9. [Testing the Setup](#testing-the-setup)
10. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Required Software

Before starting, install these tools:

#### 1. **Node.js (v18 or higher)**
```bash
# Check if installed
node --version  # Should show v18.0.0 or higher

# Download from:
https://nodejs.org/
```

#### 2. **Git**
```bash
# Check if installed
git --version

# Download from:
https://git-scm.com/
```

#### 3. **Visual Studio Code** (recommended)
```bash
# Download from:
https://code.visualstudio.com/
```

#### 4. **MetaMask Browser Extension**
```bash
# Install from:
https://metamask.io/download/
```

### Optional But Recommended

#### 5. **pnpm** (faster than npm)
```bash
npm install -g pnpm
```

#### 6. **Supabase CLI**
```bash
npm install -g supabase

# Verify installation
supabase --version
```

---

## 💻 System Requirements

- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 2GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux
- **Internet**: Stable connection for blockchain RPC calls

---

## 📥 Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the repo
git clone https://github.com/hackereeo/launchpad.git

# Navigate into directory
cd launchpad

# Check you're in the right place
ls
# You should see: contracts/ src/ supabase/ package.json
```

---

### Step 2: Install Frontend Dependencies

```bash
# Install all dependencies
npm install

# Or with pnpm (faster)
pnpm install

# This will install:
# - React, TypeScript, Vite
# - ethers.js (blockchain)
# - Supabase client
# - TailwindCSS
# - and more...

# Should complete in 1-3 minutes
```

**Expected output**:
```
added 1247 packages, and audited 1248 packages in 2m
```

---

### Step 3: Install Contract Dependencies

```bash
# Navigate to contracts folder
cd contracts

# Install Hardhat and dependencies
npm install

# This will install:
# - Hardhat (Ethereum development environment)
# - OpenZeppelin contracts
# - ethers.js
# - Testing tools

# Return to root
cd ..
```

---

## 🔐 Environment Configuration

### Step 1: Create Environment Files

```bash
# Create frontend .env file
cp .env.example .env

# Create contracts .env file
cp contracts/.env.example contracts/.env
```

---

### Step 2: Configure Frontend `.env`

Open `.env` in your editor and add these values:

```bash
# ============================================
# SUPABASE CONFIGURATION
# ============================================

# Get these from: https://app.supabase.com
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# ============================================
# BLOCKCHAIN CONFIGURATION
# ============================================

# Network: Sepolia Testnet
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia

# RPC URL - Get free API key from:
# https://www.infura.io/ OR https://www.alchemy.com/
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# ============================================
# CONTRACT ADDRESSES (fill after deployment)
# ============================================

VITE_FACTORY_ADDRESS=
VITE_WHITELIST_ADDRESS=
VITE_VESTING_ADDRESS=

# ============================================
# WALLETCONNECT (optional)
# ============================================

# Get from: https://cloud.walletconnect.com/
VITE_WALLETCONNECT_PROJECT_ID=your-project-id

# ============================================
# KYC CONFIGURATION (optional for now)
# ============================================

VITE_SUMSUB_APP_TOKEN=
VITE_SUMSUB_SECRET_KEY=
```

---

### Step 3: Get Supabase Credentials

#### Option A: Use Existing Supabase Project

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Log in or create account
3. Click your project
4. Go to **Settings** → **API**
5. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

#### Option B: Run Supabase Locally

```bash
# Start local Supabase
npx supabase start

# Wait 2-3 minutes for containers to start
# You'll see output like:

# API URL: http://localhost:54321
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Use these values in .env:
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<key-from-output>
```

---

### Step 4: Get RPC Provider API Key

**Option A: Infura (Recommended)**

1. Go to [https://www.infura.io/](https://www.infura.io/)
2. Sign up (free)
3. Create new project
4. Copy **API Key**
5. Use in `.env`:
   ```bash
   VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
   ```

**Option B: Alchemy**

1. Go to [https://www.alchemy.com/](https://www.alchemy.com/)
2. Sign up (free)
3. Create app → Select "Sepolia"
4. Copy **HTTP URL**
5. Use in `.env`:
   ```bash
   VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

---

### Step 5: Configure Contracts `.env`

Open `contracts/.env`:

```bash
# ============================================
# BLOCKCHAIN CONFIGURATION
# ============================================

# Same RPC URL as frontend
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# ============================================
# DEPLOYMENT ACCOUNT
# ============================================

# WARNING: NEVER commit this to Git!
# Create a NEW wallet for testing only

# Private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# ============================================
# ETHERSCAN VERIFICATION
# ============================================

# Get free API key from: https://etherscan.io/apis
ETHERSCAN_API_KEY=your_etherscan_key
```

---

### Step 6: Get Sepolia Test ETH

You need test ETH to deploy contracts:

1. **Create Test Wallet**:
   - Open MetaMask
   - Create new account
   - Copy private key: Settings → Security & Privacy → Reveal Private Key
   - Paste into `contracts/.env` as `PRIVATE_KEY`

2. **Get Test ETH**:
   - Copy wallet address
   - Visit faucet: [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
   - Paste address → Request ETH
   - Wait 1-2 minutes
   - Check balance in MetaMask

---

## 🗄️ Database Setup

### Option 1: Use Hosted Supabase

Already done! Your tables will be created automatically when you run migrations.

---

### Option 2: Local Supabase

If running locally:

```bash
# Make sure Supabase is running
npx supabase status

# Run migrations (create tables)
npx supabase db push

# Verify tables created
npx supabase db dump
```

---

### Step 1: Apply Migrations

```bash
# If using hosted Supabase:
npx supabase link --project-ref your-project-id
npx supabase db push

# This creates:
# - projects table
# - users table
# - investments table
# - kyc_requests table
# - whitelist_entries table
```

---

### Step 2: Seed Database (Optional)

```bash
# Add sample projects
npm run seed

# This creates:
# - 3 sample projects
# - Sample blog posts
# - FAQ entries
```

---

## 🔗 Smart Contract Setup

### Step 1: Compile Contracts

```bash
cd contracts

# Compile all contracts
npx hardhat compile

# Expected output:
# Compiled 10 Solidity files successfully

# This generates:
# - ABI files in artifacts/
# - Type definitions
```

---

### Step 2: Deploy Contracts to Testnet

```bash
# Make sure you have:
# 1. Test ETH in wallet (check MetaMask)
# 2. PRIVATE_KEY in contracts/.env
# 3. SEPOLIA_RPC_URL in contracts/.env

# Deploy all contracts
npx hardhat run scripts/deploy.ts --network sepolia

# Wait 2-3 minutes...

# You'll see output like:
# LaunchpadFactory deployed to: 0x1234...
# Whitelist deployed to: 0x5678...
# TokenVesting deployed to: 0x9abc...

# COPY THESE ADDRESSES!
```

---

### Step 3: Update Frontend Config

Copy the deployed addresses into your main `.env` file:

```bash
# From contracts deployment output
VITE_FACTORY_ADDRESS=0x1234...
VITE_WHITELIST_ADDRESS=0x5678...
VITE_VESTING_ADDRESS=0x9abc...
```

---

### Step 4: Copy ABIs to Frontend

```bash
# Still in contracts/ directory
# Copy compiled ABIs to frontend

# Create ABIs directory if it doesn't exist
mkdir -p ../src/contracts/abis

# Copy ABI files
cp artifacts/contracts/LaunchpadFactory.sol/LaunchpadFactory.json ../src/contracts/abis/
cp artifacts/contracts/IDOPool.sol/IDOPool.json ../src/contracts/abis/
cp artifacts/contracts/TokenVesting.sol/TokenVesting.json ../src/contracts/abis/
cp artifacts/contracts/Whitelist.sol/Whitelist.json ../src/contracts/abis/

# Return to root
cd ..
```

---

### Step 5: Verify Contracts on Etherscan (Optional)

```bash
cd contracts

# Verify LaunchpadFactory
npx hardhat verify --network sepolia 0x1234... # your factory address

# Verify Whitelist
npx hardhat verify --network sepolia 0x5678... # your whitelist address

# Now contracts are visible on Etherscan:
# https://sepolia.etherscan.io/address/0x1234...
```

---

## ⚛️ Frontend Setup

### Step 1: Update Contract Addresses

Edit `src/contracts/addresses.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  11155111: { // Sepolia
    factory: '0x1234...', // YOUR deployed factory address
    whitelist: '0x5678...', // YOUR deployed whitelist address
    vesting: '0x9abc...', // YOUR deployed vesting address
  },
};

export const getContractAddresses = (chainId: number) => {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[11155111];
};
```

---

### Step 2: Install VS Code Extensions (Recommended)

```
1. ESLint
2. Prettier
3. Tailwind CSS IntelliSense
4. TypeScript Error Translator
```

---

## 🎬 Running the Application

### Start Frontend Development Server

```bash
# Make sure you're in root directory
cd /path/to/launchpad

# Start Vite dev server
npm run dev

# Or with pnpm
pnpm dev

# You'll see:
# VITE v5.0.0  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

**Open browser**: [http://localhost:5173](http://localhost:5173)

---

### Start Supabase (if local)

In a separate terminal:

```bash
npx supabase start

# Keep this running
```

---

### Connect MetaMask to Sepolia

1. Open MetaMask
2. Click network dropdown (top)
3. Select "Sepolia test network"
4. If not visible:
   - Click "Add Network"
   - Select "Sepolia"

---

## ✅ Testing the Setup

### Test 1: Homepage Loads

1. Open [http://localhost:5173](http://localhost:5173)
2. Should see homepage with hero section
3. No errors in browser console (F12)

---

### Test 2: Wallet Connection

1. Click "Connect Wallet" in navbar
2. Select "MetaMask"
3. Approve connection in MetaMask popup
4. Should see your address in navbar (e.g., `0x1234...5678`)
5. Should see your ETH balance

---

### Test 3: Browse Projects

1. Click "Projects" in navbar
2. Should see list of projects (if you seeded database)
3. If empty, that's okay (you haven't created any yet)

---

### Test 4: Create Test Project (Admin)

1. Go to [http://localhost:5173/admin](http://localhost:5173/admin)
2. Fill out "Create IDO Pool" form:
   - **Project Name**: Test Project
   - **Token Address**: Deploy a test ERC20 or use existing
   - **Token Price**: 0.001 (ETH)
   - **Soft Cap**: 1 (ETH)
   - **Hard Cap**: 10 (ETH)
   - **Start Time**: (today + 1 hour)
   - **End Time**: (today + 7 days)
3. Click "Create Pool"
4. Approve transaction in MetaMask
5. Wait for confirmation
6. Should see success message

---

### Test 5: View Project

1. Go to Projects page
2. Click on your test project
3. Should see project details
4. Should see countdown timer
5. Should see progress bar

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@/components/...'"

**Solution**:
```bash
# Restart VS Code TypeScript server
# Command Palette (Ctrl+Shift+P)
# Type: "TypeScript: Restart TS Server"
```

---

### Issue: "VITE_SUPABASE_URL is not defined"

**Solution**:
```bash
# Check .env file exists
ls -la .env

# Restart Vite dev server
# Stop (Ctrl+C)
npm run dev
```

---

### Issue: "Insufficient funds for gas"

**Solution**:
```bash
# Get more test ETH
# Visit: https://sepoliafaucet.com/
# Enter your wallet address
```

---

### Issue: "Network error: Chain ID mismatch"

**Solution**:
```bash
# Switch MetaMask to Sepolia network
# MetaMask → Networks → Sepolia
```

---

### Issue: "Cannot connect to Supabase"

**Solution**:
```bash
# If using local Supabase:
npx supabase status

# If stopped, restart:
npx supabase start

# If using hosted:
# Check URL and key in .env are correct
```

---

### Issue: Contracts not found

**Solution**:
```bash
# Verify contract addresses in .env match deployment
cat .env | grep VITE_FACTORY_ADDRESS

# If empty, redeploy contracts:
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

---

### Issue: "Module not found: Can't resolve 'ethers'"

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 Success Checklist

You're fully set up when you can:

- [ ] Load homepage at http://localhost:5173
- [ ] Connect MetaMask wallet
- [ ] See your wallet address in navbar
- [ ] Browse projects page
- [ ] View project details
- [ ] See correct network (Sepolia) in MetaMask
- [ ] No errors in browser console
- [ ] No errors in terminal

---

## 📚 Next Steps

Now that you're set up:

1. **Learn the codebase**: Read [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)
2. **Understand contracts**: Read [SMART_CONTRACTS.md](./SMART_CONTRACTS.md)
3. **Make changes**: Follow [BEST_PRACTICES.md](./BEST_PRACTICES.md)
4. **Deploy to production**: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🆘 Still Having Issues?

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more solutions
2. Search existing GitHub issues
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

---

**Congratulations! You're ready to develop on CryptoLaunch! 🚀**
