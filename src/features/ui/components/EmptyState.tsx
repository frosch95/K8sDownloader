/**
 * EmptyState Component
 * 
 * A reusable component for displaying empty states with helpful messages and actions.
 */

import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      {icon && (
        <div className="mb-4 text-k8s-border/50">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-k8s-text mb-2">{title}</h3>
      {description && (
        <p className="text-k8s-muted/80 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <div className="flex justify-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
}