import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  className?: string;
}

export const CountdownTimer = ({ targetDate, label, className = '' }: CountdownTimerProps) => {
  const { days, hours, minutes, seconds, total } = useCountdown(targetDate);

  if (total <= 0) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-text-secondary">Event has ended</p>
      </div>
    );
  }

  const timeUnits = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ];

  return (
    <div className={className}>
      {label && (
        <p className="text-text-secondary text-sm mb-3 text-center">{label}</p>
      )}
      <div className="grid grid-cols-4 gap-3">
        {timeUnits.map(({ value, label }) => (
          <div key={label} className="glass-card text-center p-3">
            <div className="text-2xl md:text-3xl font-bold gradient-text">
              {String(value).padStart(2, '0')}
            </div>
            <div className="text-xs text-text-muted mt-1">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
