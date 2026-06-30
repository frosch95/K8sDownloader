/**
 * Select Component
 * 
 * A reusable select/dropdown component with consistent styling and behavior.
 */

import { ForwardedRef, forwardRef, SelectHTMLAttributes } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  label?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef(
  (
    {
      size = 'md',
      error,
      label,
      helperText,
      options,
      className = '',
      ...props
    }: SelectProps,
    ref: ForwardedRef<HTMLSelectElement>
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
        <select
          ref={ref}
          className={`${sizeClasses[size]} w-full bg-k8s-darker ${borderColor} rounded-lg text-k8s-text 
          focus:outline-none focus:ring-2 focus:ring-k8s-blue/40 transition-colors ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && (
          <p className={`text-xs ${error ? 'text-red-500' : 'text-k8s-muted/70'}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';