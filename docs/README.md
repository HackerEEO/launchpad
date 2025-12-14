# 📚 CryptoLaunch Documentation

Welcome to the **CryptoLaunch** comprehensive documentation! This guide is designed to help developers of all skill levels understand, set up, and deploy the CryptoLaunch IDO (Initial DEX Offering) Launchpad platform.

---

## 🎯 What is CryptoLaunch?

**CryptoLaunch** is a production-ready, full-stack blockchain platform that enables:

### For **Project Owners**:
- Launch token sales (IDOs) for blockchain projects
- Set up vesting schedules for token distribution
- Manage whitelists and KYC requirements
- Configure sale parameters (token price, hard cap, dates)
- Track investments and distribute tokens

### For **Investors**:
- Participate in vetted token sales
- Complete KYC verification
- Invest using cryptocurrency (ETH)
- Claim tokens according to vesting schedules
- Track portfolio and investment history

---

## 🏗️ System Architecture Overview

CryptoLaunch consists of **three main layers**:

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                    │
│  - User Interface (React + TypeScript + TailwindCSS)   │
│  - Wallet Integration (MetaMask, WalletConnect)        │
│  - Web3 Interaction (ethers.js)                        │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (Supabase)                      │
│  - PostgreSQL Database (projects, users, investments)  │
│  - Edge Functions (Deno) (KYC, investments, claims)    │
│  - Real-time subscriptions                             │
│  - Authentication & Authorization (RLS policies)        │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│            BLOCKCHAIN (Ethereum/Sepolia)                │
│  - Smart Contracts (Solidity 0.8.20)                   │
│    • LaunchpadFactory - Pool creation                  │
│    • IDOPool - Individual token sales                  │
│    • TokenVesting - Token release schedules            │
│    • Whitelist - Access control                        │
└─────────────────────────────────────────────────────────┘
```

### Data Flow Example: "User Invests in a Token Sale"

1. **Frontend**: User connects wallet → Enters investment amount → Clicks "Invest"
2. **Web3**: Frontend calls `invest()` on IDOPool smart contract
3. **Blockchain**: Transaction executes → ETH transferred → Investment recorded on-chain
4. **Backend**: Edge function detects transaction → Stores investment in database
5. **Frontend**: UI updates → Shows investment in user's portfolio

---

## 🗂️ Documentation Structure

This documentation is organized into focused guides:

### 🚀 Getting Started
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete local development setup (zero to running)
- **[QUICK_START.md](./QUICK_START.md)** - Get the platform running in 15 minutes

### 🏛️ Understanding the Codebase
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and component interactions
- **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Every folder and file explained
- **[SMART_CONTRACTS.md](./SMART_CONTRACTS.md)** - Contract integration guide

### ⚙️ Configuration & Deployment
- **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** - All `.env` variables explained
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment steps
- **[CONTRACT_DEPLOYMENT.md](./CONTRACT_DEPLOYMENT.md)** - Deploy contracts to blockchain

### 📖 Development Guides
- **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Security, coding standards, tips
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Backend API endpoints

### 🔐 Security & Compliance
- **[SECURITY.md](./SECURITY.md)** - Security considerations
- **[KYC.md](./KYC.md)** - KYC/Compliance system (Sumsub integration)

---

## 🎓 Learning Path for Beginners

If you're new to blockchain development, follow this path:

### **Step 1**: Understand the Basics
1. Read this README completely
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand how components work together
3. Check [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) to see what each file does

### **Step 2**: Set Up Your Environment
1. Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md) to install everything
2. Use [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) to configure `.env` files
3. Run the platform locally

### **Step 3**: Learn the Contracts
1. Read [SMART_CONTRACTS.md](./SMART_CONTRACTS.md) to understand blockchain layer
2. Explore the contracts in `contracts/src/`
3. Deploy contracts to testnet following [CONTRACT_DEPLOYMENT.md](./CONTRACT_DEPLOYMENT.md)

### **Step 4**: Make Changes
1. Review [BEST_PRACTICES.md](./BEST_PRACTICES.md) before coding
2. Make small changes to frontend/contracts
3. Test locally, then deploy

### **Step 5**: Deploy to Production
1. Complete security checklist in [SECURITY.md](./SECURITY.md)
2. Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) step-by-step
3. Monitor the platform after launch

---

## 🛠️ Technology Stack

### **Frontend**
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animations
- **React Router** - Navigation
- **Zustand** - State management

### **Web3 Integration**
- **ethers.js v6** - Ethereum library
- **WalletConnect** - Multi-wallet support
- **MetaMask** - Browser wallet

### **Backend**
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Edge Functions (Deno runtime)
- **Deno** - TypeScript runtime for serverless functions

### **Blockchain**
- **Solidity 0.8.20** - Smart contract language
- **Hardhat** - Development environment
- **Foundry** - Testing framework
- **OpenZeppelin** - Contract libraries
- **Ethereum (Sepolia Testnet)** - Current deployment

### **External Services**
- **Sumsub** - KYC/Identity verification
- **Vercel** - Frontend hosting (optional)
- **Infura/Alchemy** - RPC providers

---

## 📁 Project Structure Overview

```
launchpad/
├── contracts/              # Smart contracts (Solidity)
│   ├── src/               # Contract source files
│   ├── test/              # Contract tests (Hardhat + Foundry)
│   ├── scripts/           # Deployment scripts
│   └── hardhat.config.ts  # Contract configuration
│
├── src/                   # Frontend application
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── hooks/            # React hooks
│   ├── lib/              # Core libraries (web3, supabase)
│   ├── services/         # API services
│   ├── contracts/        # Contract ABIs and hooks
│   └── server/           # Backend services (KYC)
│
├── supabase/             # Backend infrastructure
│   ├── migrations/       # Database schema
│   └── functions/        # Edge functions (API endpoints)
│
├── docs/                 # Documentation (you are here!)
├── public/               # Static assets
└── scripts/              # Utility scripts (seeding, etc.)
```

---

## 🎯 Key Features

### ✅ Complete IDO Lifecycle
- Pool creation with customizable parameters
- Multi-tier whitelist system
- Investment tracking and management
- Token vesting with TGE + cliff + linear release
- Automated token claiming

### ✅ Advanced Security
- Smart contract access controls
- Input validation and sanitization
- Reentrancy protection
- Rate limiting on API endpoints
- Row Level Security (RLS) on database

### ✅ KYC/Compliance (Phase 6)
- Sumsub integration for identity verification
- Webhook handling for status updates
- Admin review interface
- Whitelist automation based on KYC status

### ✅ User Experience
- Wallet integration (MetaMask, WalletConnect, etc.)
- Real-time portfolio tracking
- Investment history and analytics
- Responsive design (mobile-friendly)
- Transaction status monitoring

### ✅ Admin Features
- Project creation and management
- KYC review dashboard
- Investment monitoring
- Whitelist management
- Analytics and reporting

---

## 🚦 Quick Start (15 Minutes)

Want to see it running right now? Follow these steps:

### 1. **Clone the Repository**
```bash
git clone https://github.com/your-repo/launchpad.git
cd launchpad
```

### 2. **Install Dependencies**
```bash
# Install frontend dependencies
npm install

# Install contract dependencies
cd contracts
npm install
cd ..
```

### 3. **Set Up Environment Variables**
```bash
# Copy example files
cp .env.example .env
cp contracts/.env.example contracts/.env

# Edit .env files with your values (see ENVIRONMENT_VARIABLES.md)
```

### 4. **Start Supabase (if using local)**
```bash
npx supabase start
```

### 5. **Run Frontend**
```bash
npm run dev
# Opens at http://localhost:5173
```

### 6. **Deploy Contracts to Testnet (optional)**
```bash
cd contracts
npx hardhat run scripts/deploy.ts --network sepolia
```

**That's it!** You now have CryptoLaunch running locally.

For complete setup with all features, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.

---

## 📞 Getting Help

### Common Issues
Check **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for solutions to common problems.

### Questions?
- Review the relevant documentation guide
- Check existing GitHub issues
- Create a new issue with details

### Contributing
See **[CONTRIBUTING.md](../CONTRIBUTING.md)** for guidelines.

---

## 🔒 Security Notice

**⚠️ IMPORTANT**: This platform handles real user funds. Before deploying to production:

1. ✅ Complete external smart contract audit
2. ✅ Implement multi-signature wallet
3. ✅ Set up timelock controller
4. ✅ Enable transaction monitoring
5. ✅ Complete security checklist in [SECURITY.md](./SECURITY.md)

**DO NOT deploy to mainnet without completing the security audit report in `PRODUCTION_AUDIT_REPORT.md`**.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Supabase for backend infrastructure
- Hardhat and Foundry teams for development tools
- The Ethereum community

---

## 📚 Next Steps

Now that you understand the overview, proceed to:

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Deep dive into system design
2. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete local development setup
3. **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Understand every file and folder

Welcome to CryptoLaunch! 🚀
