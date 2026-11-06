import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'fuel' | 'personal';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-forest/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 select-none';

    const variants = {
      primary: 'bg-forest text-white hover:bg-forest-hover shadow-sm',
      secondary: 'bg-forest-light text-forest-dark dark:bg-forest-dark/30 dark:text-forest-light hover:bg-forest-light/80',
      outline: 'border border-border-light dark:border-border-dark bg-transparent text-text-primary-light dark:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5',
      danger: 'bg-danger text-white hover:bg-danger-dark shadow-sm',
      ghost: 'bg-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5',
      fuel: 'bg-fuel text-white hover:bg-fuel-dark shadow-sm',
      personal: 'bg-personal text-white hover:bg-personal-dark shadow-sm',
    };

    const sizes = {
      sm: 'text-xs h-8 px-3 rounded-md gap-1.5',
      md: 'text-sm h-11 px-4 rounded-lg gap-2',
      lg: 'text-base h-12 px-5 rounded-lg gap-2 font-semibold',
      icon: 'h-10 w-10 rounded-lg p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

