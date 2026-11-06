import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'forest' | 'personal' | 'fuel' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    forest: 'bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-light border-forest/20',
    personal: 'bg-personal/10 text-personal dark:bg-personal/20 dark:text-personal-light border-personal/20',
    fuel: 'bg-fuel/15 text-fuel-dark dark:bg-fuel/20 dark:text-fuel border-fuel/20',
    warning: 'bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning border-warning/30',
    danger: 'bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger border-danger/20',
    neutral: 'bg-black/5 text-text-secondary-light dark:bg-white/10 dark:text-text-secondary-dark border-border-light dark:border-border-dark',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-medium border',
    md: 'text-xs px-2.5 py-1 rounded-full font-semibold border',
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5', variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
