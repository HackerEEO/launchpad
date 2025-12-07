import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

const toolCategories = [
  {
    title: 'Development Tools',
    icon: '🛠️',
    resources: [
      { name: 'Hardhat', description: 'Ethereum development environment', url: 'https://hardhat.org' },
      { name: 'Remix IDE', description: 'Online Solidity IDE', url: 'https://remix.ethereum.org' },
      { name: 'OpenZeppelin', description: 'Secure smart contract libraries', url: 'https://openzeppelin.com' },
      { name: 'Truffle Suite', description: 'Development framework for Ethereum', url: 'https://trufflesuite.com' },
    ],
  },
  {
    title: 'Security & Auditing',
    icon: '🔐',
    resources: [
      { name: 'CertiK', description: 'Leading blockchain security firm', url: 'https://certik.com' },
      { name: 'PeckShield', description: 'Smart contract auditing', url: 'https://peckshield.com' },
      { name: 'Slither', description: 'Solidity static analysis tool', url: 'https://github.com/crytic/slither' },
      { name: 'MythX', description: 'Security analysis for Ethereum', url: 'https://mythx.io' },
    ],
  },
  {
    title: 'Analytics & Data',
    icon: '📊',
    resources: [
      { name: 'Dune Analytics', description: 'Blockchain data analytics', url: 'https://dune.com' },
      { name: 'Nansen', description: 'Blockchain analytics platform', url: 'https://nansen.ai' },
      { name: 'DeFi Llama', description: 'DeFi TVL aggregator', url: 'https://defillama.com' },
      { name: 'CoinGecko', description: 'Crypto market data', url: 'https://coingecko.com' },
    ],
  },
  {
    title: 'Wallets',
    icon: '👛',
    resources: [
      { name: 'MetaMask', description: 'Most popular Web3 wallet', url: 'https://metamask.io' },
      { name: 'Ledger', description: 'Hardware wallet for security', url: 'https://ledger.com' },
      { name: 'WalletConnect', description: 'Open protocol for wallet connection', url: 'https://walletconnect.com' },
      { name: 'Coinbase Wallet', description: 'Self-custody wallet', url: 'https://wallet.coinbase.com' },
    ],
  },
  {
    title: 'Documentation',
    icon: '📚',
    resources: [
      { name: 'Ethereum.org', description: 'Official Ethereum documentation', url: 'https://ethereum.org/en/developers' },
      { name: 'Web3.js Docs', description: 'Ethereum JavaScript API', url: 'https://web3js.readthedocs.io' },
      { name: 'Ethers.js Docs', description: 'Complete Ethereum library', url: 'https://docs.ethers.io' },
      { name: 'Solidity Docs', description: 'Solidity language documentation', url: 'https://docs.soliditylang.org' },
    ],
  },
  {
    title: 'Community & Learning',
    icon: '🎓',
    resources: [
      { name: 'CryptoZombies', description: 'Learn Solidity by building games', url: 'https://cryptozombies.io' },
      { name: 'Buildspace', description: 'Web3 development courses', url: 'https://buildspace.so' },
      { name: 'ETHGlobal', description: 'Ethereum hackathons', url: 'https://ethglobal.com' },
      { name: 'DeFi Pulse', description: 'DeFi community hub', url: 'https://defipulse.com' },
    ],
  },
];

const templates = [
  {
    title: 'Token Smart Contract',
    description: 'ERC20 token with minting, burning, and pause functionality',
    language: 'Solidity',
    difficulty: 'Intermediate',
  },
  {
    title: 'Vesting Contract',
    description: 'Time-locked token distribution with cliff and linear vesting',
    language: 'Solidity',
    difficulty: 'Advanced',
  },
  {
    title: 'Web3 dApp Frontend',
    description: 'React + ethers.js boilerplate for dApp development',
    language: 'TypeScript',
    difficulty: 'Intermediate',
  },
  {
    title: 'Staking Contract',
    description: 'Stake tokens and earn rewards over time',
    language: 'Solidity',
    difficulty: 'Advanced',
  },
];

export const Resources = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-6 gradient-text">Resources</h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Curated tools, libraries, and resources to help you build and launch successful Web3 projects.
          </p>
        </motion.div>

        <div className="space-y-12">
          {toolCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">{category.icon}</span>
                <h2 className="text-3xl font-bold">{category.title}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {category.resources.map((resource, index) => (
                  <motion.a
                    key={resource.name}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="block"
                  >
                    <Card className="p-6 hover-glow h-full transition-all duration-300 hover:scale-105">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            {resource.name}
                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </h3>
                          <p className="text-text-secondary">{resource.description}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Smart Contract Templates</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Production-ready smart contract templates to kickstart your project
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover-glow h-full">
                  <h3 className="text-xl font-bold mb-2">{template.title}</h3>
                  <p className="text-text-secondary mb-4">{template.description}</p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-primary-500/20 text-primary-500 rounded-full text-sm">
                      {template.language}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      template.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-500' :
                      template.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {template.difficulty}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <Card className="p-12 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
              Our support team is here to assist you with any questions about using these resources.
            </p>
            <a href="/support" className="btn-primary px-8 py-3">
              Contact Support
            </a>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
