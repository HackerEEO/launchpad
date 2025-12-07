# 🎉 Getting Started with CryptoLaunch

Welcome! Your complete crypto token launchpad platform is ready to use. Follow these steps to get started.

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Verify Environment Variables

Your `.env` file is already configured with Supabase credentials:

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=...
```

### Step 3: Seed the Database

Populate your database with 5 diverse mock projects:

```bash
npm run seed
```

This creates:
- 2 upcoming projects (sales starting soon)
- 2 live projects (currently raising funds)
- 1 completed project (successfully funded)

### Step 4: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and explore!

## 🎯 What You Can Do Right Now

### As a Regular User

1. **Browse Projects** (`/projects`)
   - View all token launches
   - Filter by status
   - Search by name or symbol
   - Sort by various criteria

2. **View Project Details** (click any project)
   - See tokenomics
   - Check vesting schedules
   - View team information
   - Track fundraising progress

3. **Connect Wallet**
   - Click "Connect Wallet" in navbar
   - Approve MetaMask connection
   - Switch to Sepolia testnet if prompted

4. **Make Investments** (on live projects)
   - Click "Invest Now" button
   - Enter investment amount
   - Confirm transaction
   - View in your dashboard

5. **Track Portfolio** (`/dashboard`)
   - View all your investments
   - Check claimable tokens
   - Monitor performance
   - See transaction history

### As an Admin

1. **Access Admin Panel** (`/admin`)
   - First, mark your wallet as admin in Supabase
   - Go to Supabase Dashboard → users table
   - Set `is_admin = true` for your wallet address

2. **Create Projects**
   - Click "Create Project" button
   - Fill in project details
   - Add tokenomics information
   - Set sale dates
   - Submit to create

3. **Manage Projects**
   - View all projects
   - Check statistics
   - Delete projects if needed
   - Monitor platform metrics

## 📱 Test the Platform

### Test Wallet Connection

1. Install MetaMask browser extension
2. Create or import a test wallet
3. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
4. Connect on the platform
5. Try making an investment

### Test Investment Flow

1. Go to a live project
2. Click "Invest Now"
3. Enter amount (e.g., 100 USD)
4. Review token calculation
5. Confirm investment
6. Check your dashboard

### Test Admin Features

1. Mark yourself as admin (see above)
2. Access `/admin` route
3. Create a test project
4. View in projects listing
5. Make changes or delete

## 🎨 Explore the Design

The platform features a beautiful glassmorphism design:

- **Dark Theme**: Professional dark background (#0F172A)
- **Glass Cards**: Translucent cards with backdrop blur
- **Gradients**: Purple (#8B5CF6) and Cyan (#06B6D4)
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Works perfectly on all devices

## 📚 Documentation

- **README.md** - Complete project overview
- **FEATURES.md** - Detailed feature list
- **DEPLOYMENT.md** - Production deployment guide
- **This file** - Getting started guide

## 🛠 Development Commands

```bash
# Development
npm run dev         # Start dev server on port 3000

# Building
npm run build       # Build for production
npm run preview     # Preview production build

# Database
npm run seed        # Seed with mock data

# Code Quality
npm run lint        # Run ESLint
```

## 🗂 Project Structure

```
crypto-launchpad/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── layout/          # Layout components
│   │   ├── home/            # Homepage components
│   │   └── projects/        # Project components
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services
│   ├── store/               # State management
│   ├── lib/                 # Library configs
│   ├── config/              # App configuration
│   ├── types/               # TypeScript types
│   └── utils/               # Utility functions
├── scripts/                 # Utility scripts
├── supabase/               # Database migrations
└── public/                 # Static assets
```

## 🔍 Key Files to Explore

### Components
- `src/components/ui/Button.tsx` - Reusable button component
- `src/components/ui/Card.tsx` - Glass card component
- `src/components/ui/Modal.tsx` - Modal with animations
- `src/components/projects/ProjectCard.tsx` - Project card

### Pages
- `src/pages/Home.tsx` - Landing page
- `src/pages/Projects.tsx` - Projects listing
- `src/pages/ProjectDetail.tsx` - Project details
- `src/pages/Dashboard.tsx` - User dashboard
- `src/pages/Admin.tsx` - Admin panel

### Services
- `src/services/projects.service.ts` - Projects API
- `src/services/investments.service.ts` - Investments API
- `src/services/users.service.ts` - Users API

### Hooks
- `src/hooks/useWallet.ts` - Wallet operations
- `src/hooks/useProjects.ts` - Projects data
- `src/hooks/useInvestments.ts` - Investment data
- `src/hooks/useCountdown.ts` - Countdown timer

## 🎓 Learn the Codebase

### 1. Start with the App Component
Open `src/App.tsx` to see the routing structure.

### 2. Explore a Simple Page
Check `src/pages/Home.tsx` to understand page composition.

### 3. Study a Component
Look at `src/components/ui/Button.tsx` for component patterns.

### 4. Understand State Management
Review `src/store/walletStore.ts` for Zustand usage.

### 5. Check API Integration
Examine `src/services/projects.service.ts` for API patterns.

## ⚡ Next Steps

1. **Customize Design**
   - Edit colors in `tailwind.config.js`
   - Update logo and branding
   - Modify layouts as needed

2. **Add Your Projects**
   - Use admin panel to create real projects
   - Add actual token addresses
   - Configure real sale dates

3. **Deploy to Production**
   - Follow `DEPLOYMENT.md` guide
   - Deploy to Vercel or Netlify
   - Set up custom domain

4. **Configure Admin Users**
   - Add admin wallet addresses
   - Set up team access
   - Configure permissions

5. **Connect Real Blockchain**
   - Switch to mainnet when ready
   - Connect actual smart contracts
   - Integrate with your tokens

## 🐛 Troubleshooting

### Build Issues
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Database Connection
- Check Supabase credentials in `.env`
- Verify tables exist in Supabase dashboard
- Ensure RLS policies are enabled

### Wallet Connection
- Install MetaMask extension
- Switch to Sepolia testnet
- Get test ETH from faucet
- Clear browser cache if issues persist

## 💬 Need Help?

1. Check the README.md for detailed information
2. Review FEATURES.md for feature documentation
3. Read DEPLOYMENT.md for deployment help
4. Check browser console for error messages
5. Verify environment variables are set correctly

## 🎉 You're Ready!

Your crypto launchpad platform is fully functional and ready to use. Start by running:

```bash
npm run dev
```

Then visit `http://localhost:3000` and explore all the features!

---

**Happy Building!** 🚀

For production deployment, see `DEPLOYMENT.md`
For complete features list, see `FEATURES.md`
