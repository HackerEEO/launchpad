import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
}

export const ProgressBar = ({
  progress,
  className = '',
  showLabel = true,
  animated = true,
}: ProgressBarProps) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative h-3 bg-background-light rounded-full overflow-hidden">
        {animated ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-primary rounded-full"
          />
        ) : (
          <div
            className="h-full bg-gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${clampedProgress}%` }}
          />
        )}
      </div>
      {showLabel && (
        <div className="flex justify-between mt-2 text-sm text-text-secondary">
          <span>{clampedProgress.toFixed(1)}%</span>
          <span>Progress</span>
        </div>
      )}
    </div>
  );
};
