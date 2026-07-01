/**
 * CustomSelect Component
 * 
 * A custom dropdown component with full styling control to fix browser-specific
 * rendering issues like uneven borders in the dropdown list.
 */

import { useState, useRef, useEffect, useMemo } from 'react';

interface CustomSelectProps<T extends string> {
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function CustomSelect<T extends string>({ 
  value, 
  options, 
  onChange, 
  size = 'sm',
  className = '',
  disabled = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  // Derive selected option from props (controlled component pattern)
  const selectedOption = useMemo(
    () => options.find(opt => opt.value === value) || options[0] || null,
    [value, options]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const handleSelect = (option: { value: T; label: string }) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  const selectedLabel = selectedOption ? selectedOption.label : options[0]?.label || '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={`w-full flex items-center justify-between bg-k8s-darker border border-k8s-border rounded-lg text-k8s-text 
                   focus:outline-none focus:ring-2 focus:ring-k8s-blue/40 transition-colors ${sizeClasses[size]}
                   ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg 
          className="w-4 h-4 ml-2 shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <ul
          className="absolute z-10 w-full mt-1 bg-k8s-surface border border-k8s-border rounded-lg shadow-lg overflow-hidden"
          role="listbox"
        >
          {options.map((option) => (
            <li
              key={option.value}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-k8s-border/30 
                         ${option.value === selectedOption?.value ? 'bg-k8s-border/50' : ''}
                         ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !option.disabled && handleSelect(option)}
              role="option"
              aria-selected={option.value === selectedOption?.value}
              aria-disabled={option.disabled}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
