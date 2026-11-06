import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'forest' | 'personal' | 'fuel' | 'warning' | 'danger';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:
        'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm',
      forest:
        'bg-forest-light/60 dark:bg-forest-dark/20 border border-forest/20 text-text-primary-light dark:text-text-primary-dark',
      personal:
        'bg-personal-light/60 dark:bg-personal-dark/20 border border-personal/20 text-text-primary-light dark:text-text-primary-dark',
      fuel:
        'bg-fuel-light/60 dark:bg-fuel-dark/20 border border-fuel/20 text-text-primary-light dark:text-text-primary-dark',
      warning:
        'bg-warning-light/70 dark:bg-warning/10 border border-warning/30 text-text-primary-light dark:text-text-primary-dark',
      danger:
        'bg-danger-light/70 dark:bg-danger/10 border border-danger/30 text-text-primary-light dark:text-text-primary-dark',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-lg p-4 md:p-5 transition-all', variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
