# 📁 Complete Folder Structure Guide

This document explains **every folder and major file** in the CryptoLaunch codebase. Perfect for beginners who want to understand what each part does and how it fits together.

---

## 📋 Table of Contents

1. [Root Directory](#root-directory)
2. [contracts/ - Smart Contracts](#contracts---smart-contracts)
3. [src/ - Frontend Application](#src---frontend-application)
4. [supabase/ - Backend Infrastructure](#supabase---backend-infrastructure)
5. [docs/ - Documentation](#docs---documentation)
6. [Configuration Files](#configuration-files)

---

## 🏠 Root Directory

```
launchpad/
├── contracts/              # Smart contracts (blockchain layer)
├── src/                   # Frontend React app
├── supabase/              # Backend (database + API)
├── docs/                  # Documentation (you are here!)
├── public/                # Static assets
├── scripts/               # Utility scripts
├── dist/                  # Build output (generated)
├── node_modules/          # Dependencies (generated)
├── .env                   # Environment variables (DO NOT COMMIT)
├── .env.example           # Example environment file
├── .gitignore             # Git ignore rules
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite build configuration
├── tailwind.config.js     # TailwindCSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project overview
```

---

## 🔗 contracts/ - Smart Contracts

**Purpose**: Contains all Solidity smart contracts that run on the Ethereum blockchain.

```
contracts/
├── src/                   # Contract source files
├── test/                  # Contract tests
├── scripts/               # Deployment scripts
├── audit-package/         # Security audit files
├── node_modules/          # Contract dependencies
├── hardhat.config.ts      # Hardhat configuration
├── foundry.toml           # Foundry configuration
├── package.json           # Contract dependencies
├── .env                   # Contract environment variables
└── README.md              # Contract documentation
```

---

### contracts/src/ - Contract Source Files

**Purpose**: Core smart contract implementations.

#### **LaunchpadFactory.sol**
```solidity
// Creates new IDO pools
contract LaunchpadFactory {
    function createPool(...) external returns (address)
}
```

**What it does**:
- Factory pattern for deploying IDO pools
- Stores addresses of all created pools
- Emits `PoolCreated` events

**Used by**:
- Admins creating new token sales
- Frontend: `src/contracts/hooks/useFactory.ts`

**Key Functions**:
- `createPool()` - Deploy new IDO pool
- `getAllPools()` - Get list of all pools
- `getPoolsByCreator()` - Get pools created by address

---

#### **IDOPool.sol**
```solidity
// Individual token sale pool
contract IDOPool {
    function invest() external payable
    function finalize() external
    function claim() external
}
```

**What it does**:
- Manages a single token sale
- Accepts investments (ETH)
- Handles token distribution
- Manages refunds if sale fails

**Used by**:
- Investors participating in sales
- Frontend: `src/contracts/hooks/useIDOPool.ts`

**Key Functions**:
- `invest()` - Invest ETH in the sale
- `finalize()` - Lock sale (only creator)
- `claim()` - Claim vested tokens
- `refund()` - Get refund if sale fails

**State Variables**:
```solidity
address public saleToken;      // Token being sold
uint256 public tokenPrice;     // Price in wei per token
uint256 public softCap;        // Minimum raise goal
uint256 public hardCap;        // Maximum raise limit
uint256 public totalRaised;    // ETH raised so far
uint256 public startTime;      // Sale start timestamp
uint256 public endTime;        // Sale end timestamp
bool public finalized;         // Sale locked?
```

---

#### **TokenVesting.sol**
```solidity
// Manages token vesting schedules
contract TokenVesting {
    function createSchedule(...) external
    function release() external
}
```

**What it does**:
- Creates vesting schedules for investors
- Controls token release over time
- Supports TGE (Token Generation Event) unlock
- Supports cliff period + linear vesting

**Vesting Example**:
- **TGE**: 10% unlocked immediately
- **Cliff**: 3 months waiting period
- **Vesting**: Remaining 90% released linearly over 12 months

**Used by**:
- IDOPool after finalization
- Investors claiming tokens
- Frontend: `src/contracts/hooks/useVesting.ts`

---

#### **Whitelist.sol**
```solidity
// Tier-based whitelist system
contract Whitelist {
    function addToWhitelist(address, tier) external
    function getAllocation(address) external view returns (uint256)
}
```

**What it does**:
- Manages whitelist for pool access
- Assigns tier levels (Gold, Silver, Bronze)
- Controls allocation limits per tier

**Tier System**:
```
Tier 1 (Gold):   Max 10 ETH investment
Tier 2 (Silver): Max 5 ETH investment
Tier 3 (Bronze): Max 1 ETH investment
```

**Used by**:
- Admins adding whitelisted investors
- IDOPool checking investment limits
- Frontend: Admin KYC approval flow

---

#### **contracts/src/mocks/MockERC20.sol**

**Purpose**: Testing token for local development.

```solidity
contract MockERC20 is ERC20 {
    function mint(address to, uint256 amount) public
}
```

**What it does**:
- Simple ERC20 token for testing
- Allows minting for test scenarios
- No supply limit

**Used by**:
- Contract tests (`contracts/test/`)
- Local development testing

**NOT used in production**.

---

### contracts/test/ - Contract Tests

**Purpose**: Test suite for smart contracts.

#### **IDOPool.test.ts**
```typescript
describe('IDOPool', () => {
  it('should accept investments', async () => {
    await pool.invest({ value: ethers.parseEther('1.0') });
    expect(await pool.totalRaised()).to.equal(ethers.parseEther('1.0'));
  });
});
```

**What it does**:
- Tests all IDOPool functions
- Validates edge cases (overflow, underflow)
- Tests access control (only creator can finalize)

**Run tests**:
```bash
cd contracts
npx hardhat test
```

---

#### **LaunchpadFactory.test.ts**

**What it does**:
- Tests pool creation
- Validates parameter checks
- Tests event emissions

---

#### **TokenVesting.test.ts**

**What it does**:
- Tests vesting schedule creation
- Validates token release calculations
- Tests cliff and linear vesting logic

---

#### **contracts/test/fuzz/FuzzTests.t.sol**

**Purpose**: Fuzz testing with Foundry.

```solidity
function testFuzz_Invest(uint256 amount) public {
    vm.assume(amount > 0 && amount < hardCap);
    pool.invest{value: amount}();
}
```

**What it does**:
- Tests with random inputs
- Finds edge cases and overflow issues
- Uses Foundry framework

**Run fuzz tests**:
```bash
cd contracts
forge test
```

---

### contracts/scripts/ - Deployment Scripts

#### **deploy.ts**
```typescript
async function main() {
  const Factory = await ethers.getContractFactory('LaunchpadFactory');
  const factory = await Factory.deploy();
  console.log('Factory deployed to:', await factory.getAddress());
}
```

**What it does**:
- Deploys all contracts to blockchain
- Saves deployed addresses
- Verifies contracts on Etherscan

**Run deployment**:
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

---

#### **create-sample-pool.ts**

**What it does**:
- Creates a test IDO pool
- Useful for testing frontend integration
- Mints test tokens

**Run script**:
```bash
npx hardhat run scripts/create-sample-pool.ts --network localhost
```

---

### contracts/audit-package/ - Security Audit Files

**Purpose**: Prepared for external security audit.

```
audit-package/
├── CONTRACT_AUDIT_README.md   # Audit instructions
├── Findings_Report.md          # Vulnerability findings
├── THREAT_MODEL.md             # Security threat analysis
├── flattened/                  # Flattened contracts
└── reports/                    # Audit firm reports
```

**What it contains**:
- Documentation for auditors
- Threat model analysis
- Vulnerability findings
- Flattened contract files (all imports in one file)

**See**: `PRODUCTION_AUDIT_REPORT.md` for full audit results.

---

### contracts/hardhat.config.ts

**Purpose**: Configuration for Hardhat development environment.

```typescript
export default {
  solidity: '0.8.20',
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

**What it configures**:
- Solidity compiler version
- Network connections (Sepolia, mainnet)
- Deployment accounts
- Etherscan verification

---

### contracts/foundry.toml

**Purpose**: Configuration for Foundry testing framework.

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"
```

**What it configures**:
- Source and output directories
- Solidity version
- Testing parameters

---

## ⚛️ src/ - Frontend Application

**Purpose**: React application (user interface).

```
src/
├── components/            # React components
├── pages/                # Page components (routes)
├── hooks/                # React hooks
├── contracts/            # Contract ABIs and hooks
├── lib/                  # Core libraries
├── services/             # API services
├── server/               # Backend services
├── store/                # State management
├── types/                # TypeScript types
├── utils/                # Utility functions
├── App.tsx               # Main app component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

---

### src/components/ - React Components

**Purpose**: Reusable UI components.

#### **src/components/layout/**

##### **Navbar.tsx**
```typescript
export const Navbar = () => {
  const { address, isConnected, connect, disconnect } = useWallet();
  
  return (
    <nav>
      {isConnected ? (
        <button onClick={disconnect}>{address}</button>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </nav>
  );
};
```

**What it does**:
- Top navigation bar
- Wallet connection button
- Navigation links (Home, Projects, Dashboard)
- Admin link (if admin)

**Used by**: Every page (wrapped in `Layout.tsx`)

---

##### **Footer.tsx**

**What it does**:
- Bottom page footer
- Social media links
- Copyright information
- Links to Terms, Privacy Policy

---

##### **Layout.tsx**

**What it does**:
- Wraps all pages
- Includes Navbar + Footer
- Provides consistent structure

```typescript
export const Layout = ({ children }) => {
  return (
    <div>
      <Navbar />
      {children}
      <Footer />
    </div>
  );
};
```

---

#### **src/components/ui/** - UI Components

Reusable interface elements:

##### **Button.tsx**
```typescript
export const Button = ({ variant, loading, children, ...props }) => {
  return (
    <button className={variants[variant]} disabled={loading}>
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

**Variants**: `primary`, `secondary`, `danger`, `success`

---

##### **Card.tsx**
```typescript
export const Card = ({ children, className, hover }) => {
  return (
    <div className={`glass-card ${hover ? 'hover:scale-105' : ''}`}>
      {children}
    </div>
  );
};
```

**What it does**:
- Glassmorphism-styled card
- Optional hover effect
- Used for project cards, stat cards

---

##### **Modal.tsx**
```typescript
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
};
```

**Used for**:
- Wallet connection modal
- Investment confirmation
- KYC verification

---

##### **Loading.tsx**

**What it does**:
- Loading spinner component
- Skeleton loaders
- Full-screen loading state

**Variants**:
- `<Loading />` - Spinner
- `<Loading fullScreen />` - Full-page overlay
- `<SkeletonCard />` - Card placeholder

---

##### **ProgressBar.tsx**

**What it does**:
- Shows fundraising progress
- Visual percentage bar
- Animated fill effect

```typescript
<ProgressBar 
  progress={calculateProgress(raised, hardCap)} 
  showLabel 
/>
```

---

##### **CountdownTimer.tsx**

**What it does**:
- Countdown to sale start/end
- Shows days, hours, minutes, seconds
- Auto-updates every second

```typescript
<CountdownTimer targetDate={project.start_time} label="Sale starts in:" />
```

---

##### **Badge.tsx**

**What it does**:
- Status badges (Live, Upcoming, Ended, Funded)
- Color-coded variants
- Small, pill-shaped labels

---

##### **Input.tsx**

**What it does**:
- Text input with label
- Error message display
- Consistent styling

```typescript
<Input 
  label="Investment Amount (ETH)" 
  error={errors.amount}
  {...register('amount')}
/>
```

---

##### **Tabs.tsx**

**What it does**:
- Tabbed interface
- Used in ProjectDetail (Overview, Tokenomics, Team)

---

#### **src/components/projects/ProjectCard.tsx**

**What it does**:
- Displays project in grid/list
- Shows: image, name, progress, dates
- Links to project detail page

```typescript
<ProjectCard project={project} />
```

**Used in**:
- `src/pages/Projects.tsx` (all projects)
- `src/components/home/FeaturedProjects.tsx` (homepage)

---

#### **src/components/home/** - Homepage Components

##### **Hero.tsx**

**What it does**:
- Landing page hero section
- Main headline and call-to-action
- Animated gradient background

---

##### **StatsSection.tsx**

**What it does**:
- Platform statistics
- Shows: Total Raised, Active Projects, Investors
- Fetches from `useProjectStats()` hook

---

##### **FeaturedProjects.tsx**

**What it does**:
- Shows 3-6 featured projects on homepage
- Filters projects by `featured: true` flag
- Grid layout with ProjectCard components

---

#### **src/components/wallet/WalletModal.tsx**

**What it does**:
- Modal for wallet selection
- Options: MetaMask, WalletConnect, Coinbase, Trust
- Handles wallet connection logic

**Triggered by**: Navbar "Connect Wallet" button

---

### src/pages/ - Page Components

**Purpose**: Full-page views (React Router routes).

#### **Home.tsx**
```typescript
export const Home = () => {
  return (
    <div>
      <Hero />
      <StatsSection />
      <FeaturedProjects />
    </div>
  );
};
```

**Route**: `/`  
**Purpose**: Landing page

---

#### **Projects.tsx**

**What it does**:
- Lists all available projects
- Filter/search functionality
- Sort by: newest, ending soon, most funded
- Grid of ProjectCard components

**Route**: `/projects`

---

#### **ProjectDetail.tsx**

**What it does**:
- Individual project page
- Tabbed interface: Overview, Tokenomics, Team
- Investment form
- Progress bar and countdown
- KYC verification prompt

**Route**: `/projects/:id`

**Key Features**:
- Checks if user is whitelisted
- Validates investment amount
- Calls `useIDOPool().invest()` on submit
- Shows vesting schedule

---

#### **Dashboard.tsx**

**What it does**:
- User portfolio page
- Shows: total invested, total claimed, active investments
- Investment history table
- Claim tokens button

**Route**: `/dashboard`

**Requires**: Connected wallet

**Data Source**: `useInvestments(walletAddress)`

---

#### **Admin.tsx**

**What it does**:
- Admin panel for project creation
- Pool management
- Investment monitoring
- Create new IDO pool form

**Route**: `/admin`

**Requires**: Admin wallet address (checked in backend)

**Key Actions**:
- Create pool (calls `useFactory().createPool()`)
- Upload project metadata to database
- Manage whitelists

---

#### **src/pages/admin/KycReview.tsx**

**What it does**:
- KYC approval interface
- Lists pending KYC requests
- Approve/Reject buttons
- Bulk whitelist upload (CSV)
- View applicant details from Sumsub

**Route**: `/admin/kyc`

**Requires**: Admin access

**Workflow**:
1. User submits KYC via Sumsub
2. Sumsub sends webhook to backend
3. Backend updates `kyc_requests` table
4. Admin reviews in this interface
5. Admin approves → User added to whitelist contract

---

### src/contracts/ - Smart Contract Integration

**Purpose**: Bridge between frontend and blockchain.

```
src/contracts/
├── abis/                  # Contract ABIs (JSON)
├── hooks/                 # React hooks for contracts
├── addresses.ts           # Deployed contract addresses
└── index.ts               # Exports
```

---

#### **src/contracts/abis/index.ts**

**What it does**:
- Exports contract ABIs (Application Binary Interfaces)
- ABIs define contract functions and events

```typescript
import IDOPoolABI from './IDOPool.json';
import FactoryABI from './LaunchpadFactory.json';

export const IDO_POOL_ABI = IDOPoolABI.abi;
export const FACTORY_ABI = FactoryABI.abi;
```

**Generated from**: Contract compilation (`npx hardhat compile`)

---

#### **src/contracts/addresses.ts**

**What it does**:
- Stores deployed contract addresses
- Different addresses per network (Sepolia, mainnet)

```typescript
export const CONTRACT_ADDRESSES = {
  11155111: { // Sepolia
    factory: '0x123...',
    whitelist: '0x456...',
    vesting: '0x789...',
  },
  1: { // Ethereum Mainnet
    factory: '0xabc...',
    whitelist: '0xdef...',
    vesting: '0x012...',
  },
};
```

**Updated**: After deploying contracts (see `contracts/scripts/deploy.ts`)

---

#### **src/contracts/hooks/useIDOPool.ts**

**What it does**:
- React hook for IDOPool contract interaction
- Wraps ethers.js contract calls in React hooks

```typescript
export function useIDOPool() {
  const invest = async (poolAddress: string, amount: string) => {
    const contract = new Contract(poolAddress, IDO_POOL_ABI, signer);
    const tx = await contract.invest({ 
      value: ethers.parseEther(amount) 
    });
    await tx.wait();
  };

  const claim = async (poolAddress: string) => {
    const contract = new Contract(poolAddress, IDO_POOL_ABI, signer);
    const tx = await contract.claim();
    await tx.wait();
  };

  return { invest, claim, /* ... */ };
}
```

**Used by**: `src/pages/ProjectDetail.tsx`, `src/pages/Dashboard.tsx`

---

#### **src/contracts/hooks/useFactory.ts**

**What it does**:
- React hook for LaunchpadFactory contract

```typescript
export function useLaunchpadFactory() {
  const createPool = async (params: PoolParams) => {
    const contract = new Contract(factoryAddress, FACTORY_ABI, signer);
    const tx = await contract.createPool(
      params.saleToken,
      params.tokenPrice,
      params.softCap,
      params.hardCap,
      params.startTime,
      params.endTime
    );
    const receipt = await tx.wait();
    
    // Extract pool address from event
    const poolAddress = receipt.logs[0].address;
    return poolAddress;
  };

  return { createPool, /* ... */ };
}
```

**Used by**: `src/pages/Admin.tsx`

---

#### **src/contracts/hooks/useVesting.ts**

**What it does**:
- React hook for TokenVesting contract
- Fetch vesting schedules
- Calculate claimable amounts

```typescript
export function useVesting() {
  const getSchedule = async (beneficiary: string) => {
    const contract = new Contract(vestingAddress, VESTING_ABI, provider);
    const schedule = await contract.getVestingSchedule(beneficiary);
    return schedule;
  };

  const release = async () => {
    const contract = new Contract(vestingAddress, VESTING_ABI, signer);
    const tx = await contract.release();
    await tx.wait();
  };

  return { getSchedule, release, /* ... */ };
}
```

**Used by**: `src/pages/Dashboard.tsx` (claim tokens)

---

### src/hooks/ - React Hooks

**Purpose**: Reusable React logic (not contract-specific).

#### **useWallet.ts**

**What it does**:
- Manages wallet connection state
- Connects to MetaMask, WalletConnect, etc.
- Fetches balance, chain ID
- Stores in Zustand state

```typescript
export const useWallet = () => {
  const connect = async (walletType: WalletType) => {
    const provider = await web3Service.connect(walletType);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const balance = await provider.getBalance(address);
    
    useWalletStore.setState({ address, balance, isConnected: true });
  };

  const disconnect = () => {
    web3Service.disconnect();
    useWalletStore.setState({ address: null, isConnected: false });
  };

  return { connect, disconnect, /* ... */ };
};
```

**Used by**: `src/components/layout/Navbar.tsx`, all pages

---

#### **useProjects.ts**

**What it does**:
- Fetches projects from Supabase
- Filters and sorts
- Real-time subscriptions

```typescript
export const useProjects = (filters?: ProjectFilter) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      let query = supabase.from('projects').select('*');
      
      if (filters?.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      const { data } = await query;
      setProjects(data || []);
      setLoading(false);
    };

    fetchProjects();
  }, [filters]);

  return { projects, loading };
};
```

**Used by**: `src/pages/Projects.tsx`, `src/components/home/FeaturedProjects.tsx`

---

#### **useInvestments.ts**

**What it does**:
- Fetches user investments from database
- Calculates portfolio totals
- Real-time updates

```typescript
export const useInvestments = (walletAddress: string | null) => {
  const [investments, setInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    if (!walletAddress) return;

    const fetchInvestments = async () => {
      const { data } = await supabase
        .from('investments')
        .select('*, projects(*)')
        .eq('wallet_address', walletAddress);
      
      setInvestments(data || []);
    };

    fetchInvestments();

    // Real-time subscription
    const subscription = supabase
      .channel('user-investments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'investments',
        filter: `wallet_address=eq.${walletAddress}`,
      }, fetchInvestments)
      .subscribe();

    return () => subscription.unsubscribe();
  }, [walletAddress]);

  return { investments, /* ... */ };
};
```

**Used by**: `src/pages/Dashboard.tsx`

---

#### **useCountdown.ts**

**What it does**:
- Countdown timer logic
- Updates every second
- Returns days, hours, minutes, seconds

```typescript
export const useCountdown = (targetDate: string) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  function calculateTimeLeft() {
    const difference = +new Date(targetDate) - +new Date();
    
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference,
    };
  }

  return timeLeft;
};
```

**Used by**: `src/components/ui/CountdownTimer.tsx`

---

### src/lib/ - Core Libraries

#### **src/lib/web3.ts**

**Purpose**: Web3 provider and transaction management.

**What it does**:
- Creates ethers.js provider
- Connects to wallets
- Sends transactions
- Manages network switching

```typescript
class Web3Service {
  private provider: BrowserProvider | null = null;

  async connect(walletType: WalletType) {
    if (walletType === 'metamask') {
      this.provider = new BrowserProvider(window.ethereum);
    } else if (walletType === 'walletconnect') {
      // WalletConnect setup
    }
    
    return this.provider;
  }

  async getProvider() {
    if (!this.provider) {
      this.provider = new JsonRpcProvider(RPC_URL);
    }
    return this.provider;
  }

  async getSigner() {
    const provider = await this.getProvider();
    return provider.getSigner();
  }

  async sendTransaction(tx: Transaction) {
    const signer = await this.getSigner();
    const response = await signer.sendTransaction(tx);
    const receipt = await response.wait();
    return receipt;
  }
}

export const web3Service = new Web3Service();
```

**Used by**: All contract hooks, `useWallet.ts`

---

#### **src/lib/supabase.ts**

**Purpose**: Supabase client initialization.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

**Used by**: All services, hooks fetching from database

---

### src/services/ - API Services

**Purpose**: Database operations (CRUD).

#### **src/services/projects.service.ts**

```typescript
export const projectsService = {
  async getAll(filters?: ProjectFilter): Promise<Project[]> {
    let query = supabase.from('projects').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(project: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};
```

**Used by**: `useProjects.ts`, `src/pages/Admin.tsx`

---

#### **src/services/investments.service.ts**

```typescript
export const investmentsService = {
  async create(investment: Omit<Investment, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('investments')
      .insert(investment)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByWallet(walletAddress: string) {
    const { data, error } = await supabase
      .from('investments')
      .select('*, projects(*)')
      .eq('wallet_address', walletAddress);
    
    if (error) throw error;
    return data;
  },
};
```

**Used by**: `useInvestments.ts`, Edge Functions

---

#### **src/services/users.service.ts**

```typescript
export const usersService = {
  async getOrCreate(walletAddress: string) {
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (existing) return existing;

    const { data: newUser } = await supabase
      .from('users')
      .insert({ wallet_address: walletAddress })
      .select()
      .single();
    
    return newUser;
  },
};
```

**Used by**: `useWallet.ts` (auto-create user on wallet connect)

---

### src/server/ - Backend Services

**Purpose**: Server-side logic (KYC integration).

#### **src/server/kyc/adapters/sumsub.ts**

**What it does**:
- Integrates with Sumsub KYC API
- Creates applicants
- Generates access tokens for SDK
- Processes webhooks

```typescript
export class SumsubAdapter {
  async createApplicant(walletAddress: string) {
    const response = await fetch(`${SUMSUB_API_URL}/applicants`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        externalUserId: walletAddress,
        fixedInfo: { country: 'USA' },
      }),
    });
    
    return response.json();
  }

  async generateAccessToken(applicantId: string) {
    const response = await fetch(
      `${SUMSUB_API_URL}/applicants/${applicantId}/access-token`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );
    
    return response.json();
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', SUMSUB_SECRET);
    const expectedSignature = hmac.update(payload).digest('hex');
    return signature === expectedSignature;
  }
}
```

**Used by**: `supabase/functions/kyc-*`

---

#### **src/server/kyc/service.ts**

**What it does**:
- High-level KYC service
- Abstracts provider (Sumsub, Onfido, etc.)
- Business logic for KYC workflow

```typescript
export class KycService {
  async createSession(walletAddress: string) {
    // Create applicant in Sumsub
    const applicant = await sumsubAdapter.createApplicant(walletAddress);
    
    // Generate SDK token
    const token = await sumsubAdapter.generateAccessToken(applicant.id);
    
    // Store in database
    await supabase.from('kyc_requests').insert({
      wallet_address: walletAddress,
      external_id: applicant.id,
      status: 'pending',
    });
    
    return { token, applicantId: applicant.id };
  }

  async handleWebhook(payload: SumsubWebhookPayload) {
    // Update KYC status
    await supabase
      .from('kyc_requests')
      .update({ 
        status: payload.reviewResult.reviewAnswer,
        reviewed_at: new Date().toISOString(),
      })
      .eq('external_id', payload.applicantId);
  }
}
```

**Used by**: Edge Functions

---

### src/store/ - State Management

**Purpose**: Global state (Zustand).

#### **src/store/walletStore.ts**

```typescript
interface WalletStore {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  
  setAddress: (address: string) => void;
  setBalance: (balance: string) => void;
  setChainId: (chainId: number) => void;
  setIsConnected: (isConnected: boolean) => void;
  setIsConnecting: (isConnecting: boolean) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  balance: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  
  setAddress: (address) => set({ address }),
  setBalance: (balance) => set({ balance }),
  setChainId: (chainId) => set({ chainId }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
}));
```

**Used by**: All components needing wallet state

---

#### **src/store/appStore.ts**

```typescript
interface AppStore {
  isAdmin: boolean;
  currentUser: User | null;
  
  setIsAdmin: (isAdmin: boolean) => void;
  setCurrentUser: (user: User) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  isAdmin: false,
  currentUser: null,
  
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setCurrentUser: (currentUser) => set({ currentUser }),
}));
```

**Used by**: Admin pages, protected routes

---

### src/types/index.ts

**Purpose**: TypeScript type definitions.

```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  contract_address: string;
  token_address: string;
  token_symbol: string;
  token_price: number;
  soft_cap: number;
  hard_cap: number;
  start_time: string;
  end_time: string;
  raised_amount: number;
  status: 'upcoming' | 'live' | 'ended' | 'funded';
  featured: boolean;
  created_at: string;
}

export interface Investment {
  id: string;
  wallet_address: string;
  project_id: string;
  amount: number;
  tokens_allocated: number;
  claimed_amount: number;
  transaction_hash: string;
  created_at: string;
}

export interface User {
  id: string;
  wallet_address: string;
  email: string | null;
  kyc_status: 'none' | 'pending' | 'approved' | 'rejected';
  created_at: string;
}
```

**Used by**: All components, services, hooks

---

### src/utils/helpers.ts

**Purpose**: Utility functions.

```typescript
export const formatNumber = (num: number, decimals = 2): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const shortenAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const calculateProgress = (raised: number, cap: number): number => {
  return Math.min((raised / cap) * 100, 100);
};

export const getProjectStatus = (project: Project): string => {
  const now = new Date();
  const start = new Date(project.start_time);
  const end = new Date(project.end_time);
  
  if (now < start) return 'upcoming';
  if (now > end) return project.raised_amount >= project.soft_cap ? 'funded' : 'ended';
  return 'live';
};
```

**Used by**: Components for formatting display values

---

### src/App.tsx

**Purpose**: Main app component with routing.

```typescript
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/kyc" element={<KycReview />} />
          
          {/* Content pages */}
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
```

---

### src/main.tsx

**Purpose**: Entry point (mounts React app).

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

---

### src/index.css

**Purpose**: Global styles (Tailwind + custom CSS).

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-900 text-white;
  }
}

@layer components {
  .glass-card {
    @apply bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl;
  }
  
  .btn-primary {
    @apply bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700;
  }
}
```

---

## 🗄️ supabase/ - Backend Infrastructure

**Purpose**: Database, API, serverless functions.

```
supabase/
├── migrations/            # Database schema (SQL)
├── functions/            # Edge Functions (Deno)
└── .temp/                # CLI metadata
```

---

### supabase/migrations/ - Database Schema

**Purpose**: SQL migration files (version-controlled schema).

#### **20251207094543_create_projects_table.sql**

```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contract_address TEXT UNIQUE NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_price DECIMAL NOT NULL,
  soft_cap DECIMAL NOT NULL,
  hard_cap DECIMAL NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  raised_amount DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'upcoming',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert projects"
  ON projects FOR INSERT
  WITH CHECK (is_admin());
```

**What it creates**:
- `projects` table
- Row Level Security (RLS) policies
- Anyone can read, only admins can write

---

#### **20251207094545_create_users_table.sql**

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  email TEXT,
  kyc_status TEXT DEFAULT 'none',
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (wallet_address = current_user_wallet());
```

---

#### **20251207094547_create_investments_table.sql**

```sql
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  amount DECIMAL NOT NULL,
  tokens_allocated DECIMAL NOT NULL,
  claimed_amount DECIMAL DEFAULT 0,
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  USING (wallet_address = current_user_wallet());
```

---

#### **20251213100000_create_kyc_whitelist_tables.sql**

**What it creates**:
- `kyc_requests` table (verification records)
- `whitelist_entries` table (on-chain whitelist sync)
- `kyc_documents` table (metadata)

```sql
CREATE TABLE kyc_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  external_id TEXT UNIQUE NOT NULL, -- Sumsub applicant ID
  status TEXT DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE whitelist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  tier INTEGER NOT NULL,
  max_allocation DECIMAL NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### supabase/functions/ - Edge Functions

**Purpose**: Serverless API endpoints (Deno runtime).

#### **supabase/functions/process-investment/index.ts**

**Purpose**: Record investment in database after blockchain transaction.

```typescript
Deno.serve(async (req: Request) => {
  // Parse request
  const { walletAddress, projectId, amount, txHash } = await req.json();
  
  // Verify transaction on blockchain (CRITICAL - currently missing)
  // const receipt = await provider.getTransactionReceipt(txHash);
  // if (!receipt || receipt.status !== 1) throw new Error('Invalid transaction');
  
  // Insert into database
  const { data, error } = await supabase
    .from('investments')
    .insert({
      wallet_address: walletAddress,
      project_id: projectId,
      amount,
      transaction_hash: txHash,
      tokens_allocated: calculateTokens(amount, tokenPrice),
    });
  
  return new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Called by**: Frontend after successful blockchain transaction

**Security Issue**: No transaction verification (see PRODUCTION_AUDIT_REPORT.md)

---

#### **supabase/functions/claim-tokens/index.ts**

**Purpose**: Process token claim requests.

```typescript
Deno.serve(async (req: Request) => {
  const { walletAddress, projectId } = await req.json();
  
  // Get investment
  const { data: investment } = await supabase
    .from('investments')
    .select('*')
    .eq('wallet_address', walletAddress)
    .eq('project_id', projectId)
    .single();
  
  if (!investment) {
    return new Response(JSON.stringify({ error: 'Investment not found' }), {
      status: 404,
    });
  }
  
  // Calculate claimable amount (from vesting contract)
  // ... vesting logic ...
  
  // Update claimed amount
  await supabase
    .from('investments')
    .update({ claimed_amount: newClaimedAmount })
    .eq('id', investment.id);
  
  return new Response(JSON.stringify({ success: true }));
});
```

---

#### **supabase/functions/kyc-create-session/index.ts**

**Purpose**: Initiate KYC verification with Sumsub.

```typescript
import { SumsubAdapter } from '../../../src/server/kyc/adapters/sumsub.ts';

Deno.serve(async (req: Request) => {
  const { walletAddress } = await req.json();
  
  const sumsubAdapter = new SumsubAdapter(/* config */);
  
  // Create applicant
  const applicant = await sumsubAdapter.createApplicant(walletAddress);
  
  // Generate access token for SDK
  const token = await sumsubAdapter.generateAccessToken(applicant.id);
  
  // Store in database
  await supabase.from('kyc_requests').insert({
    wallet_address: walletAddress,
    external_id: applicant.id,
    status: 'pending',
  });
  
  return new Response(JSON.stringify({ 
    token, 
    applicantId: applicant.id 
  }));
});
```

**Called by**: Frontend when user clicks "Complete KYC"

---

#### **supabase/functions/kyc-webhook/index.ts**

**Purpose**: Receive KYC status updates from Sumsub.

```typescript
Deno.serve(async (req: Request) => {
  const body = await req.text();
  const signature = req.headers.get('X-Sumsub-Signature');
  
  // Verify webhook signature (HMAC)
  const isValid = sumsubAdapter.verifyWebhookSignature(body, signature);
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const payload = JSON.parse(body);
  
  // Update KYC status
  await supabase
    .from('kyc_requests')
    .update({
      status: payload.reviewResult.reviewAnswer, // 'GREEN' or 'RED'
      reviewed_at: new Date().toISOString(),
    })
    .eq('external_id', payload.applicantId);
  
  return new Response('OK');
});
```

**Called by**: Sumsub (external webhook)

**Security Issue**: No replay attack protection (see PRODUCTION_AUDIT_REPORT.md)

---

#### **supabase/functions/kyc-status/index.ts**

**Purpose**: Check KYC verification status.

```typescript
Deno.serve(async (req: Request) => {
  const { walletAddress } = await req.json();
  
  const { data: kycRequest } = await supabase
    .from('kyc_requests')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return new Response(JSON.stringify({
    status: kycRequest?.status || 'none',
    reviewedAt: kycRequest?.reviewed_at,
  }));
});
```

**Called by**: Frontend to display KYC status badge

---

#### **supabase/functions/kyc-admin/index.ts**

**Purpose**: Admin operations (list requests, update status).

```typescript
Deno.serve(async (req: Request) => {
  // Check admin authorization
  const { isAdmin } = await verifyAdmin(req);
  if (!isAdmin) {
    return new Response('Unauthorized', { status: 403 });
  }
  
  // List pending KYC requests
  const { data: requests } = await supabase
    .from('kyc_requests')
    .select('*, users(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  return new Response(JSON.stringify({ requests }));
});
```

**Called by**: `src/pages/admin/KycReview.tsx`

---

## 📚 docs/ - Documentation

**Purpose**: Project documentation (this guide!).

```
docs/
├── README.md                      # Documentation overview
├── ARCHITECTURE.md                # System architecture
├── FOLDER_STRUCTURE.md            # This file
├── SETUP_GUIDE.md                 # Local development setup
├── DEPLOYMENT_GUIDE.md            # Production deployment
├── ENVIRONMENT_VARIABLES.md       # Environment configuration
├── SMART_CONTRACTS.md             # Contract integration
├── BEST_PRACTICES.md              # Coding standards
├── TROUBLESHOOTING.md             # Common issues
└── KYC.md                         # KYC system guide
```

---

## ⚙️ Configuration Files

### package.json

**Purpose**: Frontend dependencies and scripts.

```json
{
  "name": "crypto-launchpad",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "seed": "tsx scripts/seed-database.ts"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "ethers": "^6.9.0",
    "@supabase/supabase-js": "^2.38.0",
    "zustand": "^4.4.0",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

**Key Scripts**:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run seed` - Seed database with sample data

---

### vite.config.ts

**Purpose**: Vite build tool configuration.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
```

**What it configures**:
- React plugin
- Path alias (`@/` → `src/`)
- Dev server port

---

### tailwind.config.js

**Purpose**: TailwindCSS configuration.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed', // Purple
        secondary: '#ec4899', // Pink
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
      },
    },
  },
  plugins: [],
};
```

---

### tsconfig.json

**Purpose**: TypeScript compiler configuration.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

### .env.example

**Purpose**: Example environment variables.

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Blockchain Configuration
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract Addresses
VITE_FACTORY_ADDRESS=0x...
VITE_WHITELIST_ADDRESS=0x...
VITE_VESTING_ADDRESS=0x...

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your-project-id

# Sumsub (KYC)
VITE_SUMSUB_APP_TOKEN=your-app-token
VITE_SUMSUB_SECRET_KEY=your-secret-key
```

**See**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for detailed explanations.

---

### .gitignore

**Purpose**: Files to exclude from Git.

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env
.env.local

# Build output
dist/
build/
*.tsbuildinfo

# Logs
npm-debug.log*
yarn-debug.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

---

## 🔑 Key Takeaways

### For Beginners:

1. **Smart Contracts** (`contracts/src/`) = Blockchain layer (money, tokens)
2. **Frontend** (`src/`) = User interface (React app)
3. **Backend** (`supabase/`) = Database + API (metadata, off-chain data)
4. **Flow**: User clicks button → Frontend calls contract → Blockchain executes → Backend records → UI updates

### File Naming Conventions:

- **Components**: PascalCase (`ProjectCard.tsx`)
- **Hooks**: camelCase with "use" prefix (`useWallet.ts`)
- **Services**: camelCase with ".service" suffix (`projects.service.ts`)
- **Types**: PascalCase interfaces (`Project`, `Investment`)
- **Utils**: camelCase functions (`formatCurrency`)

### Import Paths:

```typescript
// Absolute imports using @ alias
import { Button } from '@/components/ui/Button';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/lib/supabase';
```

---

## 📚 Next Steps

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Get everything running locally
- **[SMART_CONTRACTS.md](./SMART_CONTRACTS.md)** - Deep dive into contracts
- **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** - Configure `.env` files

---

**Questions?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or create an issue.
