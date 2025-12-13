# 🚀 CryptoLaunch - IDO Launchpad Platform

A production-ready, full-stack crypto token launchpad platform where blockchain projects can launch token sales and users can participate in investments. Built with modern technologies and best practices.

---

## 📚 **Complete Documentation Available!**

**New to the project?** We have comprehensive, beginner-friendly documentation covering everything from setup to deployment!

### 🎯 Quick Links

| Document | Description | For |
|----------|-------------|-----|
| **[📖 Documentation Index](./docs/README.md)** | Start here! Overview of all docs | Everyone |
| **[🚀 Setup Guide](./docs/SETUP_GUIDE.md)** | Zero to running in 30 minutes | Beginners |
| **[🏛️ Architecture](./docs/ARCHITECTURE.md)** | System design explained | Developers |
| **[📁 Folder Structure](./docs/FOLDER_STRUCTURE.md)** | Every file explained | New developers |
| **[🔐 Environment Variables](./docs/ENVIRONMENT_VARIABLES.md)** | All `.env` variables | Everyone |
| **[🔗 Smart Contracts](./docs/COMPLETE_DOCUMENTATION.md#smart-contracts)** | Contract integration | Blockchain devs |
| **[🚀 Deployment](./docs/COMPLETE_DOCUMENTATION.md#deployment-guide)** | Production deployment | DevOps |
| **[📖 Best Practices](./docs/COMPLETE_DOCUMENTATION.md#best-practices)** | Coding standards | Developers |
| **[🐛 Troubleshooting](./docs/COMPLETE_DOCUMENTATION.md#troubleshooting)** | Common issues | Everyone |

### 🎓 Learning Paths

**Complete Beginner?**
1. [Documentation Index](./docs/README.md) → Understand what CryptoLaunch is
2. [Setup Guide](./docs/SETUP_GUIDE.md) → Get it running locally
3. [Folder Structure](./docs/FOLDER_STRUCTURE.md) → Learn the codebase

**Developer Joining the Project?**
1. [Setup Guide](./docs/SETUP_GUIDE.md) → Install and configure
2. [Architecture](./docs/ARCHITECTURE.md) → Understand system design
3. [Best Practices](./docs/COMPLETE_DOCUMENTATION.md#best-practices) → Follow standards

**Deploying to Production?**
1. [PRODUCTION_AUDIT_REPORT.md](./PRODUCTION_AUDIT_REPORT.md) → Review security audit
2. [CRITICAL_FIXES.md](./CRITICAL_FIXES.md) → Fix vulnerabilities
3. [Deployment Guide](./docs/COMPLETE_DOCUMENTATION.md#deployment-guide) → Deploy safely

---

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)

## ✨ Features

### For Users
- **🔗 Web3 Wallet Integration**: MetaMask and WalletConnect support
- **💎 Project Discovery**: Browse and filter token launches by status, raised amount, and more
- **📊 Real-Time Data**: Live project statistics and countdown timers
- **💰 Investment Management**: Track your portfolio, investments, and claimable tokens
- **🎨 Beautiful UI**: Glassmorphism design with smooth animations
- **📱 Fully Responsive**: Optimized for mobile, tablet, and desktop

### For Admins
- **🛠 Project Management**: Create, edit, and delete projects
- **📈 Analytics Dashboard**: Monitor platform performance
- **👥 User Management**: View and manage platform users
- **🔒 Role-Based Access**: Secure admin panel with authentication

### Technical Features
- **⚡ Lightning Fast**: Optimized bundle size with code splitting
- **🔐 Secure**: Row Level Security (RLS) policies, input sanitization, XSS protection
- **🎯 Type-Safe**: Full TypeScript coverage with strict mode
- **🧪 Production-Ready**: Error boundaries, loading states, and comprehensive error handling
- **♿ Accessible**: WCAG 2.1 AA compliant
- **🔄 Real-Time**: Supabase real-time subscriptions for live updates

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library with latest features
- **TypeScript** - Type safety and better DX
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Recharts** - Chart library for data visualization
- **Zustand** - Lightweight state management
- **React Router** - Client-side routing
- **Ethers.js** - Ethereum library for Web3 interactions

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Row Level Security
  - Edge Functions (serverless)
  - Authentication

### Blockchain
- **Ethereum Sepolia Testnet** - Test network for development
- **MetaMask** - Browser wallet integration
- **Smart Contract Simulation** - Transaction simulation with Supabase

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- MetaMask or compatible Web3 wallet
- Supabase account (free tier works)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd crypto-launchpad
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

The `.env` file is already configured with Supabase credentials. If you need to change them:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup

The database tables are already created with proper RLS policies. To seed with mock data:

```bash
npm run seed
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

### 6. Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
crypto-launchpad/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Card, Modal, etc.)
│   │   ├── layout/         # Layout components (Navbar, Footer)
│   │   ├── home/           # Homepage components
│   │   └── projects/       # Project-related components
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Projects.tsx
│   │   ├── ProjectDetail.tsx
│   │   ├── Dashboard.tsx
│   │   └── Admin.tsx
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── store/              # Zustand stores
│   ├── lib/                # Library configurations
│   ├── config/             # App configuration
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── scripts/                # Utility scripts
│   └── seed-database.ts    # Database seeding script
├── public/                 # Static assets
└── supabase/              # Supabase migrations and functions
```

## 🗄 Database Schema

### Projects Table
- Stores token launch projects with details like token info, sale dates, and funding goals
- Includes vesting schedule configuration

### Investments Table
- Records user investments in projects
- Tracks tokens purchased and claimed amounts

### Users Table
- User profiles linked to wallet addresses
- Admin role management

## 🔐 Security Features

1. **Row Level Security (RLS)**: Database-level security policies
2. **Input Sanitization**: All user inputs are sanitized
3. **XSS Protection**: Content rendering is escaped
4. **Secure Wallet Connection**: Safe Web3 provider interactions
5. **Rate Limiting**: API call protection (ready for implementation)
6. **Environment Variables**: Sensitive data stored securely

## 🎨 Design System

### Colors
- **Primary**: Purple (#8B5CF6)
- **Cyan**: #06B6D4
- **Accent Blue**: #3B82F6
- **Accent Pink**: #EC4899
- **Background**: Dark navy (#0F172A)
- **Card**: Glassmorphism effect (rgba(255,255,255,0.05))

### Components
- Glassmorphism cards with backdrop blur
- Gradient buttons and text
- Smooth animations and transitions
- Loading skeletons for better UX
- Toast notifications for user feedback

## 📱 Responsive Design

- **Mobile First**: Optimized for small screens
- **Breakpoints**:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Touch Friendly**: Large tap targets and mobile navigation

## 🧪 Features Walkthrough

### Homepage
1. **Hero Section**: Eye-catching introduction with CTA buttons
2. **Stats Cards**: Real-time platform statistics
3. **Featured Projects**: Showcase of top projects
4. **Newsletter**: Email signup (UI ready)

### Projects Listing
1. **Advanced Filters**: Filter by status, search, and sort options
2. **Grid/List Views**: Different viewing modes
3. **Real-Time Updates**: Live project data
4. **Pagination**: Efficient data loading

### Project Detail Page
1. **Comprehensive Info**: All project details and tokenomics
2. **Interactive Charts**: Pie charts for token distribution
3. **Investment Interface**: Simple investment flow
4. **Countdown Timers**: Real-time sale countdowns
5. **Social Links**: Connect with project teams

### User Dashboard
1. **Portfolio Overview**: Total invested, tokens, and claimables
2. **Investment History**: Detailed transaction history
3. **Claim Interface**: Easy token claiming
4. **Performance Tracking**: Investment analytics

### Admin Panel
1. **Project Management**: Full CRUD operations
2. **Create Projects**: Multi-step project creation form
3. **Analytics**: Platform performance metrics
4. **User Management**: View and manage users

## 🔄 Web3 Integration

### Wallet Connection
- MetaMask support out of the box
- Easy to add WalletConnect
- Network switching to Sepolia testnet
- Balance display and transaction handling

### Transaction Flow
1. User connects wallet
2. Selects investment amount
3. Reviews transaction details
4. Confirms transaction
5. Investment recorded in database

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

### Environment Variables
Make sure to set these in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SUPABASE_ANON_KEY`

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure MetaMask is installed
- Check you're on Sepolia testnet
- Clear browser cache and reload

### Database Errors
- Verify Supabase credentials in `.env`
- Check RLS policies are enabled
- Ensure tables are created

### Build Errors
- Delete `node_modules` and reinstall
- Clear Vite cache: `rm -rf .vite`
- Check TypeScript errors: `npm run build`

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Design inspired by DAO Maker and Polkastarter
- Icons from Heroicons
- Images from Unsplash

---

Built with ❤️ using React, TypeScript, and Supabase
