# 🚀 Deployment Guide

This guide will help you deploy your CryptoLaunch platform to production.

## Prerequisites

- Node.js 18+ installed
- Supabase account
- Git repository (GitHub, GitLab, etc.)
- Vercel or Netlify account (recommended)
- RPC provider account (Alchemy, Infura, or QuickNode)
- WalletConnect project ID

## Step 1: Network Configuration

### 1.1 Choose Your Network

CryptoLaunch supports multiple EVM networks. Choose based on your needs:

| Network | Chain ID | Gas Fees | Best For |
|---------|----------|----------|----------|
| **Arbitrum One** | 42161 | Very Low | Production (recommended) |
| **Base** | 8453 | Very Low | Production (recommended) |
| **Optimism** | 10 | Low | Production |
| **Polygon** | 137 | Low | Production |
| **Ethereum** | 1 | High | High-value launches |
| **Sepolia** | 11155111 | Free | Development/Testing |

### 1.2 Get RPC URLs

You'll need RPC URLs from a provider. Choose one:

#### Alchemy (Recommended)
1. Sign up at [alchemy.com](https://www.alchemy.com/)
2. Create a new app for your target network
3. Copy the HTTPS URL
4. Example: `https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY`

#### Infura
1. Sign up at [infura.io](https://infura.io/)
2. Create a new project
3. Copy the endpoint URL
4. Example: `https://arbitrum-mainnet.infura.io/v3/YOUR_PROJECT_ID`

#### QuickNode
1. Sign up at [quicknode.com](https://www.quicknode.com/)
2. Create an endpoint for your network
3. Copy the HTTP URL

### 1.3 Get WalletConnect Project ID

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com/)
2. Sign up / Sign in
3. Create a new project
4. Copy the Project ID

### 1.4 Configure Environment Variables

Copy `.env.example` to `.env` and update:

```bash
# Network Selection
VITE_CHAIN_ID=42161                    # Arbitrum One
VITE_CHAIN_NAME=Arbitrum One
VITE_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
VITE_EXPLORER_BASE_URL=https://arbiscan.io

# WalletConnect
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 1.5 Deploy Smart Contracts

Before launching, deploy your contracts to the target network:

```bash
cd contracts
npm install

# Deploy to Arbitrum (example)
npx hardhat run scripts/deploy.ts --network arbitrum

# Copy the deployed addresses to your .env file
```

Update your `.env` with the deployed contract addresses:

```bash
VITE_LAUNCHPAD_FACTORY_ARBITRUM=0x...
VITE_VESTING_CONTRACT_ARBITRUM=0x...
VITE_WHITELIST_ARBITRUM=0x...
```

## Step 1: Prepare Your Database

### 1.1 Supabase Project Setup

Your Supabase database is already configured with:
- ✅ Projects table with RLS policies
- ✅ Investments table with RLS policies
- ✅ Users table with RLS policies
- ✅ Automatic triggers for updating raised amounts

### 1.2 Seed the Database

To populate your database with mock projects for testing:

```bash
npm run seed
```

This will create 5 diverse projects:
- 2 upcoming projects
- 2 live projects
- 1 completed project

## Step 2: Environment Variables

Ensure your environment variables are set:

**Local Development (.env):**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Production (Vercel/Netlify):**
Add the same environment variables in your hosting platform's dashboard.

## Step 3: Build and Test

### 3.1 Test the Build

```bash
npm run build
```

Expected output:
```
✓ built in ~12s
dist/index.html                          1.30 kB
dist/assets/index-*.css                 22.26 kB
dist/assets/ui-vendor-*.js             115.26 kB
dist/assets/react-vendor-*.js          162.60 kB
dist/assets/web3-vendor-*.js           269.11 kB
dist/assets/index-*.js                 270.92 kB
dist/assets/charts-vendor-*.js         358.88 kB
```

### 3.2 Test Locally

```bash
npm run preview
```

Visit `http://localhost:4173` to test the production build locally.

## Step 4: Deploy to Vercel (Recommended)

### 4.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 4.2 Deploy

```bash
vercel
```

Follow the prompts to:
1. Link to your Vercel account
2. Configure project settings
3. Set environment variables
4. Deploy

### 4.3 Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_SUPABASE_ANON_KEY`
3. Redeploy if needed

## Step 5: Deploy to Netlify (Alternative)

### 5.1 Install Netlify CLI

```bash
npm install -g netlify-cli
```

### 5.2 Deploy

```bash
netlify deploy --prod
```

### 5.3 Configure Build Settings

In Netlify Dashboard:
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add environment variables in Site Settings

## Step 6: Post-Deployment

### 6.1 Verify Functionality

Test these critical features:
- ✅ Homepage loads correctly
- ✅ Projects listing displays data
- ✅ Project details page works
- ✅ Wallet connection works
- ✅ Admin panel requires proper permissions
- ✅ Database queries execute correctly
- ✅ Real-time updates work

### 6.2 Admin User Setup

To make a user an admin:

1. Connect wallet on the deployed site
2. Go to Supabase dashboard
3. Navigate to Table Editor → users
4. Find the user by wallet_address
5. Set `is_admin` to `true`

### 6.3 Performance Optimization

#### Enable Caching

Add these headers to your hosting platform:

```
# Vercel (vercel.json)
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### Enable Compression

Most platforms enable gzip/brotli compression by default. Verify in network tab.

## Step 7: Monitoring and Analytics

### 7.1 Add Error Tracking

Consider adding Sentry for error tracking:

```bash
npm install @sentry/react @sentry/vite-plugin
```

### 7.2 Add Analytics

Optional: Add Google Analytics or Plausible

### 7.3 Monitor Performance

Use:
- Vercel Analytics
- Lighthouse CI
- Web Vitals monitoring

## Step 8: Custom Domain (Optional)

### Vercel

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records as instructed

### Netlify

1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records

## Security Checklist

Before going live, verify:

- ✅ RLS policies are enabled on all tables
- ✅ Environment variables are not exposed in client code
- ✅ HTTPS is enforced
- ✅ API keys are properly secured
- ✅ Admin routes are protected
- ✅ Input validation is in place
- ✅ CORS is configured correctly

## Maintenance

### Regular Tasks

1. **Monitor Database**: Check Supabase dashboard regularly
2. **Update Dependencies**: Run `npm update` monthly
3. **Review Logs**: Check error logs weekly
4. **Backup Data**: Set up automatic backups in Supabase
5. **Test Wallet Integration**: Verify MetaMask compatibility

### Updating the App

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Deploy
vercel --prod  # or netlify deploy --prod
```

## Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

### Database Connection Issues

- Verify Supabase URL and key in environment variables
- Check RLS policies in Supabase dashboard
- Ensure tables are created properly

### Wallet Connection Issues

- Verify you're on the correct network (Sepolia)
- Check MetaMask is installed and unlocked
- Clear browser cache and try again

## Support

For issues:
1. Check the main README.md
2. Review Supabase logs
3. Check browser console for errors
4. Verify all environment variables are set

## Success Metrics

Track these KPIs:
- Active users
- Total value raised
- Number of projects launched
- Wallet connections
- Page load times

---

**Congratulations!** 🎉 Your crypto launchpad is now live!
