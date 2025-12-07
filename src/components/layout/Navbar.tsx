import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/store/appStore';
import { formatWalletAddress } from '@/utils/helpers';
import { Button } from '@/components/ui/Button';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address, isConnected, connect, disconnect, balance } = useWallet();
  const { isAdmin } = useAppStore();
  const location = useLocation();

  const navLinks: Array<{ path?: string; label: string; submenu?: Array<{ path: string; label: string }> }> = [
    { path: '/', label: 'Home' },
    { path: '/projects', label: 'Projects' },
    {
      label: 'Learn',
      submenu: [
        { path: '/how-it-works', label: 'How It Works' },
        { path: '/resources', label: 'Resources' },
        { path: '/faq', label: 'FAQ' },
        { path: '/blog', label: 'Blog' },
      ]
    },
    {
      label: 'Company',
      submenu: [
        { path: '/about', label: 'About Us' },
        { path: '/careers', label: 'Careers' },
        { path: '/support', label: 'Support' },
      ]
    },
    { path: '/dashboard', label: 'Dashboard' },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-30 glass-card border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">CryptoLaunch</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => {
              if (link.submenu) {
                return (
                  <div key={link.label} className="relative group">
                    <button className="font-medium text-text-secondary hover:text-white transition-colors flex items-center gap-1">
                      {link.label}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-48 glass-card rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      {link.submenu.map(sublink => (
                        <Link
                          key={sublink.path}
                          to={sublink.path}
                          className="block px-4 py-3 text-text-secondary hover:text-white hover:bg-white/5 first:rounded-t-lg last:rounded-b-lg transition-colors"
                        >
                          {sublink.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={link.path || link.label}
                  to={link.path || '/'}
                  className={`font-medium transition-colors relative ${
                    link.path && isActive(link.path)
                      ? 'text-white'
                      : 'text-text-secondary hover:text-white'
                  }`}
                >
                  {link.label}
                  {link.path && isActive(link.path) && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-gradient-primary"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:block">
            {isConnected ? (
              <div className="flex items-center gap-4">
                <div className="glass-card px-4 py-2 text-sm">
                  <div className="text-text-muted text-xs">Balance</div>
                  <div className="font-semibold">{Number(balance).toFixed(4)} ETH</div>
                </div>
                <Button variant="secondary" onClick={disconnect}>
                  {formatWalletAddress(address || '')}
                </Button>
              </div>
            ) : (
              <Button onClick={connect}>Connect Wallet</Button>
            )}
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-4 pt-4 border-t border-white/10"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map(link => {
                if (link.submenu) {
                  return (
                    <div key={link.label}>
                      <div className="font-medium text-white mb-2">{link.label}</div>
                      <div className="flex flex-col gap-2 pl-4">
                        {link.submenu.map(sublink => (
                          <Link
                            key={sublink.path}
                            to={sublink.path}
                            onClick={() => setIsMenuOpen(false)}
                            className="font-medium text-text-secondary hover:text-white transition-colors"
                          >
                            {sublink.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <Link
                    key={link.path || link.label}
                    to={link.path || '/'}
                    onClick={() => setIsMenuOpen(false)}
                    className={`font-medium transition-colors ${
                      link.path && isActive(link.path) ? 'text-white' : 'text-text-secondary'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-white/10">
                {isConnected ? (
                  <div className="space-y-2">
                    <div className="glass-card px-4 py-2 text-sm">
                      <div className="text-text-muted text-xs">Balance</div>
                      <div className="font-semibold">{Number(balance).toFixed(4)} ETH</div>
                    </div>
                    <Button variant="secondary" onClick={disconnect} className="w-full">
                      {formatWalletAddress(address || '')}
                    </Button>
                  </div>
                ) : (
                  <Button onClick={connect} className="w-full">
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
};
