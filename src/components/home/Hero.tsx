import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export const Hero = () => {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-cyan/20 animate-gradient" />

      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/30 rounded-full filter blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan/30 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-6 px-4 py-2 rounded-full glass-card"
          >
            <span className="gradient-text font-semibold">🚀 Welcome to the Future of Token Launches</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Launch Your Crypto Project with{' '}
            <span className="gradient-text">Confidence</span>
          </h1>

          <p className="text-xl md:text-2xl text-text-secondary mb-10 max-w-2xl mx-auto">
            The premier IDO launchpad for innovative blockchain projects. Connect investors with groundbreaking crypto ventures.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/projects">
              <Button size="lg">
                Explore Projects
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary" size="lg">
                View Dashboard
              </Button>
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { value: '$50M+', label: 'Total Raised' },
              { value: '100+', label: 'Projects Launched' },
              { value: '50K+', label: 'Investors' },
            ].map((stat, index) => (
              <div key={index} className="glass-card p-6">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-text-muted text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
