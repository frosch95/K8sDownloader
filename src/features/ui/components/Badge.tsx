/**
 * Badge Component
 * 
 * A reusable badge component for displaying status indicators, tags, etc.
 */

import { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const variantStyles = {
    primary: 'bg-gradient-accent/15 text-k8s-link',
    success: 'bg-gradient-to-r from-green-500/15 to-green-500/5 text-green-400',
    warning: 'bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 text-yellow-400',
    danger: 'bg-gradient-to-r from-red-500/15 to-red-500/5 text-red-400',
    info: 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-blue-400',
    neutral: 'bg-gradient-to-r from-k8s-surface/40 to-k8s-surface/20 text-k8s-muted',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-full font-medium inline-flex items-center gap-1 ${className}`}
    >
      {children}
    </span>
  );
}