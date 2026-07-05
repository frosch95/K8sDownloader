/**
 * Tooltip Component
 * 
 * A reusable tooltip component that shows additional information on hover.
 */

import { ReactNode, useState } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-k8s-text bg-gradient-subtle border border-k8s-border/60 rounded-lg shadow-xl shadow-black/10 backdrop-blur-sm
          ${positionStyles[position]} whitespace-nowrap`}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-2 h-2 bg-gradient-subtle border-t border-l border-k8s-border/60 rotate-45 
          ${position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
          ${position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
          ${position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' : ''}
          ${position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' : ''}`} />
        </div>
      )}
    </div>
  );
}