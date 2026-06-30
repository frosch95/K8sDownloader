/**
 * Button Component
 * 
 * A reusable button component with various variants and sizes.
 * This component provides consistent styling and behavior across the application.
 */

import { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
  ariaLabel?: string;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  className = '',
  title,
  ariaLabel,
}: ButtonProps) {
  const baseStyles = "rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-k8s-blue/40 disabled:opacity-40 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-k8s-blue text-white hover:bg-k8s-blue/90",
    secondary: "bg-k8s-surface text-k8s-text hover:bg-k8s-surface/80",
    ghost: "text-k8s-muted hover:text-k8s-text hover:bg-k8s-surface/50",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      title={title}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="animate-spin">⏳</span>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}