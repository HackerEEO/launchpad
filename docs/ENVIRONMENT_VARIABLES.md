# 🔐 Environment Variables Reference

Complete guide to all environment variables used in CryptoLaunch. This document explains what each variable does, where to get the values, and how to use them properly.

---

## 📋 Table of Contents

1. [Frontend Environment Variables](#frontend-environment-variables)
2. [Contract Environment Variables](#contract-environment-variables)
3. [Supabase Edge Functions Environment Variables](#supabase-edge-functions-environment-variables)
4. [Getting API Keys and Credentials](#getting-api-keys-and-credentials)
5. [Security Best Practices](#security-best-practices)
6. [Environment-Specific Configurations](#environment-specific-configurations)

---

## ⚛️ Frontend Environment Variables

**File**: `.env` (root directory)

All frontend variables must be prefixed with `VITE_` to be accessible in the browser.

---

### Supabase Configuration

#### `VITE_SUPABASE_URL`

**Description**: Your Supabase project URL

**Example**:
```bash
VITE_SUPABASE_URL=https://idddddddddd.supabase.co
```

**Where to get it**:
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL**

**Local Development**:
```bash
VITE_SUPABASE_URL=http://localhost:54321
```

**Used in**: `src/lib/supabase.ts`

**Required**: ✅ Yes

---

#### `VITE_SUPABASE_ANON_KEY`

**Description**: Public anonymous key for Supabase client

**Example**:
```bash
VITE_SUPABASE_ANON_KEY=jwjwjwjwjjwjwjwjwjwj...
```

**Where to get it**:
1. Same location as URL
2. **Settings** → **API**
3. Copy **anon public** key

**Security**: 
- Safe to expose in frontend (public key)
- Row Level Security (RLS) protects data
- **DO NOT** use service_role key in frontend!

**Local Development**:
```bash
# Get from: npx supabase status
VITE_SUPABASE_ANON_KEY=neeejejejejejejejen...
```

**Used in**: `src/lib/supabase.ts`

**Required**: ✅ Yes

---

### Blockchain Configuration

#### `VITE_CHAIN_ID`

**Description**: Blockchain network ID

**Example**:
```bash
# Sepolia Testnet
VITE_CHAIN_ID=11155111

# Ethereum Mainnet (DO NOT use until audited!)
VITE_CHAIN_ID=1
```

**Common Chain IDs**:
- **1** - Ethereum Mainnet
- **11155111** - Sepolia Testnet
- **5** - Goerli Testnet (deprecated)
- **137** - Polygon Mainnet
- **80001** - Polygon Mumbai Testnet

**Used in**: `src/lib/web3.ts`, contract hooks

**Required**: ✅ Yes

**Current**: `11155111` (Sepolia)

---

#### `VITE_CHAIN_NAME`

**Description**: Human-readable network name

**Example**:
```bash
VITE_CHAIN_NAME=Sepolia
```

**Used in**: UI display, error messages

**Required**: ✅ Yes

---

#### `VITE_RPC_URL`

**Description**: Blockchain RPC endpoint URL

**Example**:
```bash
# Infura
VITE_RPC_URL=https://sepolia.infura.io/v3/kjjjjjjjjjjjjjjj

# Alchemy
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key

# Public (unreliable, not recommended)
VITE_RPC_URL=https://rpc.sepolia.org
```

**Where to get API key**:

**Option 1: Infura**
1. Go to [https://infura.io](https://infura.io)
2. Sign up (free tier: 100k requests/day)
3. Create new project
4. Copy API key
5. Use format: `https://sepolia.infura.io/v3/YOUR_API_KEY`

**Option 2: Alchemy**
1. Go to [https://alchemy.com](https://alchemy.com)
2. Sign up (free tier: 300M compute units/month)
3. Create app → Select network
4. Copy HTTP URL

**Used in**: `src/lib/web3.ts`, `src/config/web3.ts`

**Required**: ✅ Yes

**Performance**: Infura and Alchemy are faster than public RPCs

---

### Contract Addresses

#### `VITE_FACTORY_ADDRESS`

**Description**: Deployed LaunchpadFactory contract address

**Example**:
```bash
VITE_FACTORY_ADDRESS=jjjjjjjjjjjjjj
```

**Where to get it**:
- From contract deployment output
- After running: `npx hardhat run scripts/deploy.ts --network sepolia`

**Used in**: `src/contracts/addresses.ts`, `src/contracts/hooks/useFactory.ts`

**Required**: ✅ Yes (after deploying contracts)

**Leave empty**: Until you deploy contracts

---

#### `VITE_WHITELIST_ADDRESS`

**Description**: Deployed Whitelist contract address

**Example**:
```bash
VITE_WHITELIST_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

**Where to get it**: Same as factory (deployment output)

**Used in**: Admin KYC approval flow

**Required**: ✅ Yes

---

#### `VITE_VESTING_ADDRESS`

**Description**: Deployed TokenVesting contract address

**Example**:
```bash
VITE_VESTING_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Where to get it**: Same as factory

**Used in**: `src/contracts/hooks/useVesting.ts`, token claiming

**Required**: ✅ Yes

---

### WalletConnect Configuration

#### `VITE_WALLETCONNECT_PROJECT_ID`

**Description**: WalletConnect Cloud project ID for multi-wallet support

**Example**:
```bash
VITE_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Where to get it**:
1. Go to [https://cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign up (free)
3. Create new project
4. Copy Project ID

**Used in**: `src/lib/web3.ts` - WalletConnect provider setup

**Required**: 🟡 Optional (but needed for WalletConnect support)

**Without it**: Users can only use MetaMask and injected wallets

---

### KYC Configuration (Sumsub)

#### `VITE_SUMSUB_APP_TOKEN`

**Description**: Sumsub application token for KYC verification

**Example**:
```bash
VITE_SUMSUB_APP_TOKEN=sbx:12345678-abcd-1234-efgh-123456789abc
```

**Where to get it**:
1. Go to [https://cockpit.sumsub.com](https://cockpit.sumsub.com)
2. Sign up (sandbox is free)
3. Go to **Settings** → **App tokens**
4. Create new token
5. Copy App Token

**Environment prefixes**:
- `sbx:` - Sandbox (testing)
- `prd:` - Production

**Used in**: `src/server/kyc/adapters/sumsub.ts`

**Required**: 🟡 Optional (only if using KYC features)

**Security**: 
- ⚠️ This token is safe to expose in frontend
- It only allows SDK initialization
- Secret key should NEVER be in frontend

---

#### `VITE_SUMSUB_SECRET_KEY`

**Description**: Sumsub secret key for API requests

**Example**:
```bash
VITE_SUMSUB_SECRET_KEY=sbxsec:ABC123...XYZ789
```

**⚠️ CRITICAL SECURITY WARNING**:
- **DO NOT put this in frontend `.env`!**
- **ONLY use in backend** (Supabase Edge Functions)
- See [Supabase Edge Functions Environment Variables](#supabase-edge-functions-environment-variables)

**Where to get it**:
1. Same place as App Token
2. **Settings** → **App tokens**
3. Reveal Secret Key
4. **KEEP SECURE!**

**Used in**: Backend Edge Functions only

**Required**: 🟡 Only for KYC backend operations

---

## 🔧 Contract Environment Variables

**File**: `contracts/.env`

**⚠️ WARNING**: This file contains private keys. NEVER commit to Git!

---

### Blockchain Configuration

#### `SEPOLIA_RPC_URL`

**Description**: RPC endpoint for contract deployment

**Example**:
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
```

**Same as**: `VITE_RPC_URL` (but without VITE_ prefix)

**Used in**: `contracts/hardhat.config.ts`

**Required**: ✅ Yes

---

#### `MAINNET_RPC_URL`

**Description**: Ethereum mainnet RPC (for future production deployment)

**Example**:
```bash
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_API_KEY
```

**Used in**: Mainnet deployment

**Required**: ❌ Not yet (testnet only currently)

**DO NOT use mainnet** until security audit is complete!

---

### Deployment Account

#### `PRIVATE_KEY`

**Description**: Private key of wallet that deploys contracts

**Example**:
```bash
PRIVATE_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

**⚠️ CRITICAL SECURITY**:
- **NEVER commit this to Git!**
- **Use a NEW wallet for testing only!**
- **NEVER use your main wallet!**
- **DO NOT share this key!**

**How to get it**:
1. Open MetaMask
2. Click account menu
3. Account Details
4. Export Private Key
5. Enter password
6. Copy (remove 0x prefix)

**Format**: 64 hexadecimal characters (no 0x prefix)

**Correct**:
```bash
PRIVATE_KEY=abc123...xyz789  # ✅ No 0x prefix
```

**Incorrect**:
```bash
PRIVATE_KEY=0xabc123...xyz789  # ❌ Has 0x prefix
```

**Used in**: `contracts/hardhat.config.ts`, deployment scripts

**Required**: ✅ Yes (for deploying contracts)

---

### Etherscan Verification

#### `ETHERSCAN_API_KEY`

**Description**: API key for verifying contracts on Etherscan

**Example**:
```bash
ETHERSCAN_API_KEY=ABC123XYZ456DEF789GHI012JKL345
```

**Where to get it**:
1. Go to [https://etherscan.io/apis](https://etherscan.io/apis)
2. Sign up (free)
3. Add → Create API Key
4. Copy API Key Token

**Used in**: Contract verification after deployment

**Required**: 🟡 Optional (but recommended for transparency)

**Without it**: Contracts won't be verified on Etherscan (users can't read source code)

---

## 🚀 Supabase Edge Functions Environment Variables

**Set via**: Supabase Dashboard or CLI

---

### Sumsub Backend Secrets

#### `SUMSUB_APP_TOKEN`

**Description**: Same as `VITE_SUMSUB_APP_TOKEN` but for backend

**Example**:
```bash
SUMSUB_APP_TOKEN=sbx:12345678-abcd-1234-efgh-123456789abc
```

**Set via CLI**:
```bash
npx supabase secrets set SUMSUB_APP_TOKEN="sbx:12345678..."
```

**Set via Dashboard**:
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions
3. Add secret: `SUMSUB_APP_TOKEN`

**Used in**: KYC edge functions

---

#### `SUMSUB_SECRET_KEY`

**Description**: Sumsub secret for HMAC signature verification

**Example**:
```bash
SUMSUB_SECRET_KEY=sbxsec:ABC123...XYZ789
```

**⚠️ CRITICAL**: Keep this secure! Used for webhook verification.

**Set via CLI**:
```bash
npx supabase secrets set SUMSUB_SECRET_KEY="sbxsec:ABC..."
```

**Used in**: `supabase/functions/kyc-webhook/index.ts`

---

### Database Connection

#### `SUPABASE_URL`

**Description**: Supabase project URL (backend version)

**Example**:
```bash
SUPABASE_URL=https://vyaqqnwznfdufijxxoar.supabase.co
```

**Auto-injected**: Supabase automatically provides this to edge functions

**You don't need to set this manually**

---

#### `SUPABASE_SERVICE_ROLE_KEY`

**Description**: Service role key for admin database operations

**Example**:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ CRITICAL**: 
- Full database access
- Bypasses Row Level Security
- **NEVER expose in frontend**
- Only use in edge functions

**Where to get it**:
1. Supabase Dashboard
2. Settings → API
3. Copy **service_role** key (hidden by default)

**Auto-injected**: Available in edge functions automatically

---

## 🔑 Getting API Keys and Credentials

### Quick Reference Table

| Service | Purpose | Where to Sign Up | Free Tier |
|---------|---------|------------------|-----------|
| Supabase | Database + Backend | [app.supabase.com](https://app.supabase.com) | ✅ 500MB DB, 2GB bandwidth |
| Infura | RPC Provider | [infura.io](https://infura.io) | ✅ 100k requests/day |
| Alchemy | RPC Provider | [alchemy.com](https://alchemy.com) | ✅ 300M compute units/month |
| WalletConnect | Multi-wallet | [cloud.walletconnect.com](https://cloud.walletconnect.com) | ✅ Unlimited |
| Sumsub | KYC Verification | [cockpit.sumsub.com](https://cockpit.sumsub.com) | ✅ Sandbox only |
| Etherscan | Contract Verification | [etherscan.io/apis](https://etherscan.io/apis) | ✅ 5 calls/sec |

---

## 🔒 Security Best Practices

### ✅ DO:

1. **Use `.env` files** (never hardcode secrets)
2. **Add `.env` to `.gitignore`**
3. **Use different keys** for dev/staging/production
4. **Rotate keys** regularly
5. **Use environment-specific** Supabase projects
6. **Verify** third-party API credentials regularly

### ❌ DON'T:

1. **Commit `.env` to Git** (biggest mistake!)
2. **Share private keys** in Slack, email, etc.
3. **Use production keys** in development
4. **Expose service role key** in frontend
5. **Use same wallet** for dev and production
6. **Store secrets in browser localStorage**

---

### Protecting Private Keys

```bash
# ✅ CORRECT: Use .env file
# .env (gitignored)
PRIVATE_KEY=abc123...

# ❌ WRONG: Hardcode in source
const privateKey = "abc123..."; // NEVER DO THIS!
```

---

### Checking for Exposed Secrets

```bash
# Check if .env is gitignored
git check-ignore .env
# Should output: .env

# Check for accidentally committed secrets
git log --all --full-history --source --all -- .env
# Should be empty

# Remove .env from Git history if accidentally committed
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 🌍 Environment-Specific Configurations

### Development

```bash
# .env.development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/...
VITE_FACTORY_ADDRESS=0x5FbDB... # Local deployment
```

---

### Staging

```bash
# .env.staging
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>
VITE_CHAIN_ID=11155111  # Still testnet
VITE_RPC_URL=https://sepolia.infura.io/v3/...
VITE_FACTORY_ADDRESS=0x1234... # Staging deployment
```

---

### Production

```bash
# .env.production
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=<prod-anon-key>
VITE_CHAIN_ID=1  # Mainnet (when ready)
VITE_RPC_URL=https://mainnet.infura.io/v3/...
VITE_FACTORY_ADDRESS=0xabcd... # Production deployment
```

**⚠️ DO NOT deploy to mainnet until security audit is complete!**

---

## 📝 Example Complete `.env` File

```bash
# ============================================
# SUPABASE CONFIGURATION
# ============================================
VITE_SUPABASE_URL=https://hhhhhhhhh.supabase.co
VITE_SUPABASE_ANON_KEY=hhhhhhhhhhhhhh.jujjjjjjjjjjjj.jjjjjjjj

# ============================================
# BLOCKCHAIN CONFIGURATION
# ============================================
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=https://sepolia.infura.io/v3/jjjjjjjjjjjj

# ============================================
# CONTRACT ADDRESSES (deployed)
# ============================================
VITE_FACTORY_ADDRESS=kjkjjjjjjjjjjjjjj
VITE_WHITELIST_ADDRESS=jkkkkkkkkk
VITE_VESTING_ADDRESS=jjjjjjjjjjj

# ============================================
# WALLETCONNECT (optional)
# ============================================
VITE_WALLETCONNECT_PROJECT_ID=nnnnnnnnnnnnn

# ============================================
# KYC CONFIGURATION (optional)
# ============================================
VITE_SUMSUB_APP_TOKEN=sbx:12345678-abcd-1234-efgh-123456789abc
# VITE_SUMSUB_SECRET_KEY - NEVER put in frontend!
```

---

## 📚 Related Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Production deployment
- **[SECURITY.md](./SECURITY.md)** - Security best practices
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues

---

## 🆘 Need Help?

**Forgot to set a variable?**
- Check browser console (F12) for "undefined" errors
- Look for error message mentioning "import.meta.env.VITE_..."

**Not sure which environment?**
- Development: Running locally (`npm run dev`)
- Staging: Deployed to test server
- Production: Live site with real users

**Key not working?**
- Verify no extra spaces/quotes in `.env`
- Restart dev server after changing `.env`
- Check API key hasn't expired

---

**Remember**: Environment variables are your application's secrets. Treat them with care! 🔐
