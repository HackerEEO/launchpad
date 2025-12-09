import { motion } from 'framer-motion';

interface LoadingStateProps {
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  text,
  variant = 'spinner',
  size = 'md',
  className = '',
  fullScreen = false,
}: LoadingStateProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center py-12';

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`rounded-full bg-primary-500 ${
                  size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
                }`}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <motion.div
            className={`rounded-full bg-primary-500/30 ${sizes[size]}`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <div className="h-full w-full rounded-full bg-primary-500" />
          </motion.div>
        );

      case 'skeleton':
        return (
          <div className="w-full max-w-md space-y-4">
            <div className="h-4 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-700" />
          </div>
        );

      default:
        return (
          <div className={`relative ${sizes[size]}`}>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-slate-700"
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-500"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <motion.div
              className="absolute inset-1 rounded-full border-2 border-transparent border-t-accent-500"
              animate={{ rotate: -360 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`${containerClass} ${className}`}
    >
      {renderLoader()}
      {text && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mt-4 text-slate-400 ${textSizes[size]}`}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}

// Skeleton loaders for specific use cases
export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-slate-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-700" />
          <div className="h-3 w-1/2 rounded bg-slate-700" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 rounded bg-slate-700" />
        <div className="h-4 w-5/6 rounded bg-slate-700" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-20 rounded-lg bg-slate-700" />
        <div className="h-8 w-20 rounded-lg bg-slate-700" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-12 w-12 rounded-xl bg-slate-700" />
        <div className="h-6 w-16 rounded-full bg-slate-700" />
      </div>
      <div className="h-3 w-20 rounded bg-slate-700" />
      <div className="mt-2 h-8 w-32 rounded bg-slate-700" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-700/50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 animate-pulse rounded bg-slate-700" />
        </td>
      ))}
    </tr>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-lg bg-slate-800/50 p-4"
        >
          <div className="h-10 w-10 rounded-full bg-slate-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-slate-700" />
            <div className="h-3 w-1/4 rounded bg-slate-700" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-slate-700" />
        </div>
      ))}
    </div>
  );
}
