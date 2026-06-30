/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner component with customizable size and color.
 */

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'text-k8s-blue',
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${color} ${className} animate-spin rounded-full border-t-transparent`}
      role="status"
      aria-label="Loading…"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}