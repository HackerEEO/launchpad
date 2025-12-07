import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';

const steps = [
  {
    number: '01',
    title: 'Connect Your Wallet',
    description: 'Link your Web3 wallet (MetaMask, WalletConnect, etc.) to access the platform securely.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: '02',
    title: 'Browse Projects',
    description: 'Explore upcoming and live token sales. Review project details, tokenomics, and team information.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: 'from-purple-500 to-pink-500',
  },
  {
    number: '03',
    title: 'Conduct Due Diligence',
    description: 'Review audit reports, whitepapers, tokenomics, and vesting schedules before investing.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-green-500 to-teal-500',
  },
  {
    number: '04',
    title: 'Participate in Sale',
    description: 'Commit funds during the sale period. Your allocation is calculated based on the project terms.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'from-orange-500 to-red-500',
  },
  {
    number: '05',
    title: 'Claim Your Tokens',
    description: 'After the sale ends, claim your tokens based on the vesting schedule from your dashboard.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-yellow-500 to-orange-500',
  },
];

const features = [
  {
    title: 'Secure Smart Contracts',
    description: 'All projects undergo rigorous smart contract audits by leading security firms.',
    icon: '🔒',
  },
  {
    title: 'Fair Token Distribution',
    description: 'Transparent allocation mechanisms ensure equal opportunity for all participants.',
    icon: '⚖️',
  },
  {
    title: 'Vesting Protection',
    description: 'Token vesting schedules protect investors from immediate sell pressure.',
    icon: '⏰',
  },
  {
    title: 'KYC Verification',
    description: 'Optional KYC/AML compliance for projects requiring regulatory adherence.',
    icon: '✅',
  },
  {
    title: 'Multi-Chain Support',
    description: 'Support for Ethereum, BSC, Polygon, and other major blockchain networks.',
    icon: '🔗',
  },
  {
    title: '24/7 Support',
    description: 'Dedicated support team available around the clock to assist with any issues.',
    icon: '💬',
  },
];

export const HowItWorks = () => {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-6 gradient-text">How It Works</h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Launch your crypto journey in five simple steps. Our platform makes participating in token sales easy, secure, and transparent.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-1/2 top-24 w-0.5 h-32 bg-gradient-to-b from-primary-500 to-transparent -translate-x-1/2" />
              )}

              <div className={`flex flex-col md:flex-row items-center gap-8 mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                <div className="flex-1">
                  <Card className="p-8 hover-glow">
                    <div className="flex items-start gap-6">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}>
                        {step.icon}
                      </div>
                      <div>
                        <div className="text-4xl font-bold gradient-text mb-2">{step.number}</div>
                        <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                        <p className="text-text-secondary leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4 gradient-text">Platform Features</h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Everything you need for a successful token launch experience
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 h-full hover-glow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Card className="p-12 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
              Connect your wallet and explore the latest token sale opportunities from vetted projects.
            </p>
            <div className="flex gap-4 justify-center">
              <a href="/projects" className="btn-primary px-8 py-3">
                Browse Projects
              </a>
              <a href="/faq" className="btn-secondary px-8 py-3">
                Learn More
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
