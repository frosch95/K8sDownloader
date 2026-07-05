/**
 * ProgressBar Component
 * 
 * A reusable progress bar component for showing progress indicators.
 */

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'bg-k8s-blue',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeStyles = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full bg-k8s-surface/30 rounded-full overflow-hidden ${sizeStyles[size]} ${className} shadow-inner`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color === 'bg-k8s-blue' ? 'bg-gradient-to-r from-k8s-blue to-k8s-blue/80' : color}`}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
    </div>
  );
}