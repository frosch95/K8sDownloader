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
    primary: 'bg-k8s-blue/20 text-k8s-link',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
    neutral: 'bg-k8s-surface/50 text-k8s-muted',
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