export const Loading = ({ fullScreen = false, size = 'md' }: { fullScreen?: boolean; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const spinner = (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-4 border-primary/20 border-t-primary ${sizeClasses[size]}`} />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export const SkeletonCard = () => {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-background-light rounded-full" />
        <div className="flex-1">
          <div className="h-6 bg-background-light rounded w-3/4 mb-2" />
          <div className="h-4 bg-background-light rounded w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-background-light rounded w-full" />
        <div className="h-4 bg-background-light rounded w-5/6" />
        <div className="h-3 bg-background-light rounded-full w-full" />
      </div>
    </div>
  );
};
