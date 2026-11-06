import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefixText?: string;
  suffixText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, prefixText, suffixText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefixText && (
            <span className="absolute left-3.5 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark pointer-events-none select-none">
              {prefixText}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full h-11 rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3.5 text-sm font-medium text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light/60 dark:placeholder:text-text-secondary-dark/60 focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest transition-colors',
              prefixText && 'pl-9',
              suffixText && 'pr-12',
              error && 'border-danger focus:ring-danger/30 focus:border-danger',
              className
            )}
            {...props}
          />
          {suffixText && (
            <span className="absolute right-3.5 text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark pointer-events-none select-none">
              {suffixText}
            </span>
          )}
        </div>
        {error && <p className="text-xs font-medium text-danger">{error}</p>}
        {hint && !error && (
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

