# 🏛️ CryptoLaunch Architecture Guide

This document provides a comprehensive explanation of how CryptoLaunch is architected, how different components interact, and how data flows through the system.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Three-Layer Architecture](#three-layer-architecture)
3. [Smart Contract Layer](#smart-contract-layer)
4. [Backend Layer](#backend-layer)
5. [Frontend Layer](#frontend-layer)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Component Interactions](#component-interactions)
8. [Security Architecture](#security-architecture)

---

## 🎯 System Overview

CryptoLaunch is built using a **three-layer architecture** that separates concerns:

```
┌──────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                         │
│              (Frontend - User Interface)                     │
│  React + TypeScript + TailwindCSS + ethers.js               │
└──────────────────────────────────────────────────────────────┘
                            ↕ (HTTP/WebSocket + Web3 RPC)
┌──────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│              (Backend - Business Logic)                      │
│  Supabase (PostgreSQL + Edge Functions + Real-time)         │
└──────────────────────────────────────────────────────────────┘
                            ↕ (Blockchain RPC)
┌──────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN LAYER                           │
│              (Smart Contracts - State)                       │
│  Ethereum/Sepolia (Solidity contracts)                      │
└──────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**Separation of Concerns**: Each layer has a specific responsibility
- **Frontend**: User interaction and display
- **Backend**: Data persistence, API, off-chain logic
- **Blockchain**: Critical state, token transfers, immutable records

**Scalability**: Backend can cache blockchain data, reducing RPC calls

**Security**: Smart contracts handle critical operations (money), backend handles non-critical data

---

## 🏗️ Three-Layer Architecture

### Layer 1: Smart Contract Layer (Blockchain)

**Location**: `contracts/src/`

**Responsibility**: 
- Execute critical financial operations
- Store immutable state (investments, token ownership)
- Enforce access control and validation rules

**Components**:
1. **LaunchpadFactory.sol** - Creates new IDO pools
2. **IDOPool.sol** - Manages individual token sales
3. **TokenVesting.sol** - Controls token release schedules
4. **Whitelist.sol** - Tier-based access control

**Data Stored On-Chain**:
- Investment amounts (ETH contributions)
- Token allocations
- Vesting schedules
- Whitelist status and tiers
- Pool configuration (price, caps, dates)

**Not Stored On-Chain** (too expensive):
- User profiles (email, KYC status)
- Project descriptions, images
- Transaction history metadata

---

### Layer 2: Backend Layer (Supabase)

**Location**: `supabase/`

**Responsibility**:
- Store off-chain data (projects, users, metadata)
- Provide API endpoints for frontend
- Process KYC verifications
- Listen for blockchain events
- Cache blockchain data for fast queries

**Components**:

#### A. PostgreSQL Database (`supabase/migrations/`)
Stores:
- **projects** - Project details (name, description, images)
- **users** - User profiles (wallet, email, KYC status)
- **investments** - Investment history (synced from blockchain)
- **kyc_requests** - KYC verification records
- **whitelist_entries** - Whitelist allocations

#### B. Edge Functions (`supabase/functions/`)
Serverless API endpoints:
- **process-investment** - Records investment in database
- **claim-tokens** - Processes token claims
- **kyc-webhook** - Receives KYC updates from Sumsub
- **kyc-create-session** - Initiates KYC verification
- **kyc-status** - Checks KYC verification status
- **kyc-admin** - Admin KYC management

#### C. Real-time Subscriptions
Enables live updates:
- Portfolio changes
- New projects
- Investment updates

**Security Features**:
- Row Level Security (RLS) - Users can only see their own data
- API key authentication
- Rate limiting (to be implemented - see PRODUCTION_AUDIT_REPORT.md)

---

### Layer 3: Frontend Layer (React)

**Location**: `src/`

**Responsibility**:
- Display user interface
- Connect to wallets (MetaMask, WalletConnect)
- Interact with smart contracts via ethers.js
- Fetch data from Supabase
- Handle user inputs and validation

**Components**:

#### A. Pages (`src/pages/`)
Full-page views:
- **Home.tsx** - Landing page with featured projects
- **Projects.tsx** - Browse all token sales
- **ProjectDetail.tsx** - Individual project page with invest button
- **Dashboard.tsx** - User portfolio and investments
- **Admin.tsx** - Admin panel for project management
- **KycReview.tsx** - KYC approval interface

#### B. Components (`src/components/`)
Reusable UI pieces:
- **layout/** - Navbar, Footer, Layout wrapper
- **ui/** - Buttons, Cards, Modals, Loading states
- **projects/** - ProjectCard component
- **home/** - Hero, FeaturedProjects, StatsSection

#### C. Hooks (`src/hooks/`)
Reusable logic:
- **useWallet.ts** - Wallet connection state
- **useProjects.ts** - Fetch projects from Supabase
- **useInvestments.ts** - Fetch user investments

#### D. Contract Hooks (`src/contracts/hooks/`)
Smart contract interactions:
- **useIDOPool.ts** - Invest, finalize, claim functions
- **useVesting.ts** - Vesting schedule management
- **useFactory.ts** - Create new pools

#### E. Services (`src/services/`)
API communication:
- **projects.service.ts** - Project CRUD operations
- **users.service.ts** - User profile management
- **investments.service.ts** - Investment tracking

#### F. Web3 Integration (`src/lib/web3.ts`)
Core blockchain connectivity:
- Provider setup (Infura, Alchemy)
- Wallet connection handling
- Transaction management
- Contract instance creation

---

## 🔄 Data Flow Diagrams

### Flow 1: User Invests in a Token Sale

```
┌─────────┐
│  USER   │ Clicks "Invest 1 ETH" button
└────┬────┘
     ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (ProjectDetail.tsx)                        │
│ 1. Validates input (minimum investment, hard cap)   │
│ 2. Calls useIDOPool hook                           │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ CONTRACT HOOK (useIDOPool.ts)                       │
│ 1. Gets IDOPool contract instance                  │
│ 2. Calls invest() with ETH value                   │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ WEB3 LIBRARY (src/lib/web3.ts)                      │
│ 1. Builds transaction with ethers.js               │
│ 2. Sends to user's wallet for signature            │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ USER'S WALLET (MetaMask)                            │
│ User reviews and confirms transaction               │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ BLOCKCHAIN (IDOPool.sol)                            │
│ 1. Validates investment (whitelist, caps, dates)   │
│ 2. Transfers ETH from user to pool                 │
│ 3. Records investment in investors[] array          │
│ 4. Emits InvestmentMade event                      │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ BACKEND (supabase/functions/process-investment)     │
│ 1. Listens for InvestmentMade event (polling/webhook)|
│ 2. Extracts: investor address, amount, project_id  │
│ 3. Inserts into investments table                  │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ DATABASE (Supabase PostgreSQL)                      │
│ INSERT INTO investments (wallet_address, amount...) │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (Dashboard.tsx)                            │
│ 1. Real-time subscription receives update           │
│ 2. Re-fetches user investments                     │
│ 3. Updates UI to show new investment               │
└─────────────────────────────────────────────────────┘
```

**Key Points**:
- **Critical data** (investment amount, ETH transfer) → Blockchain
- **Metadata** (user email, project description) → Database
- **Real-time updates** via Supabase subscriptions
- **Event-driven** architecture (smart contract emits events)

---

### Flow 2: Admin Creates New IDO Pool

```
┌─────────┐
│ ADMIN   │ Fills pool creation form
└────┬────┘
     ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (Admin.tsx)                                │
│ 1. Collects: token address, price, caps, dates     │
│ 2. Calls useLaunchpadFactory hook                  │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ CONTRACT HOOK (useFactory.ts)                       │
│ 1. Calls createPool() on LaunchpadFactory           │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ BLOCKCHAIN (LaunchpadFactory.sol)                   │
│ 1. Validates parameters                            │
│ 2. Deploys new IDOPool contract                    │
│ 3. Stores pool address in allPools[] array         │
│ 4. Emits PoolCreated event with pool address       │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (Admin.tsx)                                │
│ 1. Receives pool address from transaction receipt  │
│ 2. Calls projects.service.create()                 │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ BACKEND SERVICE (projects.service.ts)               │
│ 1. Inserts project into database with pool address │
│ 2. Stores: name, description, images, social links │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ DATABASE (projects table)                           │
│ Stores project metadata with contract_address      │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (Projects.tsx)                             │
│ New project appears in projects list               │
└─────────────────────────────────────────────────────┘
```

---

### Flow 3: User Completes KYC Verification

```
┌─────────┐
│  USER   │ Clicks "Complete KYC" button
└────┬────┘
     ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (ProjectDetail.tsx or Dashboard.tsx)       │
│ 1. Calls backend API to create KYC session         │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ EDGE FUNCTION (kyc-create-session)                  │
│ 1. Creates applicant in Sumsub                     │
│ 2. Generates access token for SDK                  │
│ 3. Returns session details to frontend             │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (Sumsub SDK embedded)                      │
│ 1. Loads Sumsub verification widget                │
│ 2. User uploads ID, takes selfie                   │
│ 3. Submits documents                                │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ SUMSUB (External KYC Provider)                      │
│ 1. Verifies documents                              │
│ 2. Runs compliance checks                          │
│ 3. Determines: APPROVED or REJECTED                │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ EDGE FUNCTION (kyc-webhook)                         │
│ 1. Receives webhook from Sumsub                    │
│ 2. Verifies HMAC signature                         │
│ 3. Updates kyc_requests table with result          │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ DATABASE (kyc_requests table)                       │
│ UPDATE kyc_requests SET status = 'approved'        │
└────────────────────────┬────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ FRONTEND (Dashboard.tsx)                            │
│ Real-time subscription detects change               │
│ UI shows "KYC Approved ✅"                         │
└─────────────────────────────────────────────────────┘
```

---

## 🔗 Component Interactions

### How Contracts Connect to Frontend

#### Step 1: Compile Contracts
```bash
cd contracts
npx hardhat compile
```
Generates ABI files in `contracts/artifacts/`

#### Step 2: Copy ABIs to Frontend
Manually or via script:
```bash
cp contracts/artifacts/src/IDOPool.sol/IDOPool.json src/contracts/abis/
```

#### Step 3: Import ABI in Frontend
```typescript
// src/contracts/abis/index.ts
import IDOPoolABI from './IDOPool.json';

export const IDO_POOL_ABI = IDOPoolABI.abi;
```

#### Step 4: Create Contract Instance
```typescript
// src/contracts/hooks/useIDOPool.ts
import { Contract } from 'ethers';
import { IDO_POOL_ABI } from '../abis';
import { web3Service } from '@/lib/web3';

const poolContract = new Contract(
  poolAddress,
  IDO_POOL_ABI,
  web3Service.getSigner()
);
```

#### Step 5: Call Contract Functions
```typescript
// Invest 1 ETH in pool
const tx = await poolContract.invest({
  value: ethers.parseEther('1.0')
});

await tx.wait(); // Wait for confirmation
```

---

### How Frontend Connects to Backend

#### Using Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export { supabase };
```

#### Querying Data
```typescript
// src/services/projects.service.ts
import { supabase } from '@/lib/supabase';

export const projectsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};
```

#### Real-time Subscriptions
```typescript
// src/hooks/useProjects.ts
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

useEffect(() => {
  const subscription = supabase
    .channel('projects-changes')
    .on('postgres_changes', {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'projects'
    }, (payload) => {
      console.log('Project changed:', payload);
      // Re-fetch projects
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

#### Calling Edge Functions
```typescript
// Call KYC creation endpoint
const { data, error } = await supabase.functions.invoke(
  'kyc-create-session',
  {
    body: { walletAddress: '0x123...' }
  }
);
```

---

## 🔐 Security Architecture

### Layer 1: Smart Contract Security

**Access Control**:
```solidity
// Only pool creator can finalize
modifier onlyCreator() {
    require(msg.sender == creator, "Not creator");
    _;
}

// Only after sale ends
modifier onlyAfterEnd() {
    require(block.timestamp > endTime, "Sale not ended");
    _;
}
```

**Reentrancy Protection**:
```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract IDOPool is ReentrancyGuard {
    function invest() external payable nonReentrant {
        // Safe from reentrancy attacks
    }
}
```

**Input Validation**:
```solidity
require(amount > 0, "Invalid amount");
require(amount <= hardCap - totalRaised, "Exceeds hard cap");
```

---

### Layer 2: Backend Security (Supabase)

**Row Level Security (RLS)**:
```sql
-- Users can only view their own investments
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  USING (wallet_address = current_user_wallet());

-- Only admins can insert projects
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  WITH CHECK (is_admin());
```

**API Authentication**:
```typescript
// All requests require API key
const { data } = await supabase
  .from('users')
  .select('*')
  // Automatically includes anon key from client
```

**Rate Limiting** (to be implemented):
```typescript
// Limit: 10 requests per minute per IP
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000
});
```

---

### Layer 3: Frontend Security

**Wallet Validation**:
```typescript
// Verify connected to correct chain
if (chainId !== 11155111) {
  throw new Error('Please connect to Sepolia');
}
```

**Input Sanitization**:
```typescript
// Validate investment amount
const amount = parseFloat(input);
if (isNaN(amount) || amount <= 0) {
  throw new Error('Invalid amount');
}
```

**Transaction Confirmation**:
```typescript
// Wait for 2 block confirmations
const receipt = await tx.wait(2);
if (receipt.status !== 1) {
  throw new Error('Transaction failed');
}
```

---

## 🎯 Summary

### Key Architectural Principles

1. **Separation of Concerns**: Blockchain for critical state, backend for metadata, frontend for UX
2. **Event-Driven**: Smart contracts emit events → Backend listens → Frontend updates
3. **Real-time**: Supabase subscriptions enable live updates without polling
4. **Modular**: Each component (contracts, services, hooks) is independently testable
5. **Secure by Default**: RLS, access controls, input validation at every layer

### Data Flow Summary

```
User Action → Frontend → Web3 → Blockchain → Event
                   ↓                            ↓
              Supabase API                  Backend Listener
                   ↓                            ↓
              Database ←───────────────────────┘
                   ↓
         Real-time Subscription
                   ↓
            Frontend Updates
```

---

## 📚 Next Steps

- **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Detailed file-by-file breakdown
- **[SMART_CONTRACTS.md](./SMART_CONTRACTS.md)** - Deep dive into contract architecture
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Get the system running locally

---

**Questions?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or create an issue.
