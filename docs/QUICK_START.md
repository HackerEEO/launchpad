# ⚡ Quick Start Guide (15 Minutes)

Get CryptoLaunch running on your machine in just 15 minutes! This is the fastest path from zero to a working application.

---

## 🎯 Prerequisites

Before you begin, install these (5 minutes):

1. **Node.js** - [Download here](https://nodejs.org/) (choose LTS version)
2. **Git** - [Download here](https://git-scm.com/)
3. **MetaMask** - [Install extension](https://metamask.io/download/)
4. **Code Editor** - [VS Code recommended](https://code.visualstudio.com/)

Check installations:
```bash
node --version  # Should show v18+
git --version   # Should show git version
```

---

## 🚀 5 Steps to Running

### Step 1: Get the Code (1 minute)

```bash
# Clone repository
git clone https://github.com/hackereeo/launchpad.git

# Enter directory
cd launchpad
```

---

### Step 2: Install Dependencies (2 minutes)

```bash
# Install frontend packages
npm install

# Install contract packages
cd contracts
npm install
cd ..
```

Wait for installation to complete (1-3 minutes)...

---

### Step 3: Configure Environment (3 minutes)

```bash
# Copy example environment files
cp .env.example .env
cp contracts/.env.example contracts/.env
```

**Edit `.env` file** (at minimum, set these):

```bash
# Use the existing Supabase project (from .env in workspace)
VITE_SUPABASE_URL=https://hdhdhdhd.supabase.co
VITE_SUPABASE_ANON_KEY=jdjdj.jdjdjdjd.jdjdjdj

# Blockchain (Sepolia Testnet)
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_RPC_URL=https://sepolia.infura.io/v3/jdjdjdj

# Contract addresses (leave empty for now)
VITE_FACTORY_ADDRESS=
VITE_WHITELIST_ADDRESS=
VITE_VESTING_ADDRESS=
```

**That's enough to run the frontend!** (Full setup in docs/SETUP_GUIDE.md)

---

### Step 4: Start the Application (1 minute)

```bash
# Start development server
npm run dev
```

You'll see:
```
VITE v5.0.0  ready in 500 ms
➜  Local:   http://localhost:5173/
```

---

### Step 5: Open in Browser

**Open**: [http://localhost:5173](http://localhost:5173)

**You should see**:
- ✅ Homepage with hero section
- ✅ "Connect Wallet" button in navbar
- ✅ No errors in browser console (press F12 to check)

---

## 🎉 Success!

**You now have CryptoLaunch running locally!** 🚀

---

## 🔗 Next Steps

### To Connect Your Wallet

1. Click "Connect Wallet" in navbar
2. Select "MetaMask"
3. Switch to Sepolia network in MetaMask
4. Approve connection

### To Deploy Contracts (Optional - Advanced)

See: [SETUP_GUIDE.md](./SETUP_GUIDE.md) sections on:
- Getting test ETH from faucet
- Deploying contracts to Sepolia
- Copying ABIs to frontend

### To Learn the Codebase

**Recommended order**:
1. [README.md](./README.md) - Project overview
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - How it works
3. [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) - Code walkthrough

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: "Port 5173 already in use"
```bash
# Kill process using port
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

### Issue: Page won't load
```bash
# Check dev server is running (should see "Local: http://localhost:5173")
# If not, run: npm run dev

# Check no errors in terminal
# If errors, read error message and fix
```

---

## 📚 Full Documentation

This quick start skips many details. For complete understanding:

- **Full Setup**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **All Docs**: [README.md](./README.md) (documentation index)

---

## ✅ What You've Accomplished

- [x] Installed all prerequisites
- [x] Cloned the repository
- [x] Installed dependencies
- [x] Configured environment
- [x] Started development server
- [x] Viewed the application in browser

**Total time**: ~15 minutes

---

## 🎯 Summary

**You're ready to develop!** Here's what you can do now:

1. **Explore** - Click around the app
2. **Connect Wallet** - Test wallet integration
3. **Read Code** - Open files in VS Code
4. **Make Changes** - Edit and see live updates
5. **Learn More** - Read full documentation

**Need help?** Check [TROUBLESHOOTING.md](./COMPLETE_DOCUMENTATION.md#troubleshooting)

---

**Happy coding! 🚀**
