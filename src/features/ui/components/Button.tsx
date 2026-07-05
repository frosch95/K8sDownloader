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
  const baseStyles = "rounded-lg focus:outline-none focus:ring-2 focus:ring-k8s-blue/40 disabled:opacity-40 disabled:cursor-not-allowed hover-lift";
  
  const variantStyles = {
    primary: "bg-gradient-accent text-white shadow-glow hover:opacity-90",
    secondary: "bg-k8s-surface/60 text-k8s-text hover:bg-k8s-surface/90 border border-k8s-border/30 backdrop-blur-sm",
    ghost: "text-k8s-muted hover:text-k8s-text hover:bg-k8s-surface/30",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:opacity-90",
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