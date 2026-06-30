/**
 * Input Component
 * 
 * A reusable input component with consistent styling and behavior.
 */

import { ForwardedRef, forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  label?: string;
  helperText?: string;
}

export const Input = forwardRef(
  (
    {
      size = 'md',
      error,
      label,
      helperText,
      className = '',
      ...props
    }: InputProps,
    ref: ForwardedRef<HTMLInputElement>
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    };

    const borderColor = error ? 'border-red-500' : 'border-k8s-border';

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-k8s-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${sizeClasses[size]} w-full bg-k8s-darker ${borderColor} rounded-lg text-k8s-text placeholder:text-k8s-muted/50 
          focus:outline-none focus:ring-2 focus:ring-k8s-blue/40 transition-colors ${className}`}
          {...props}
        />
        {helperText && (
          <p className={`text-xs ${error ? 'text-red-500' : 'text-k8s-muted/70'}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';