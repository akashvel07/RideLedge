import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'forest' | 'fuel' | 'personal' | 'neutral';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'neutral',
}) => {
  const iconVariants = {
    forest: 'bg-forest/10 text-forest dark:bg-forest/20 dark:text-forest-light',
    fuel: 'bg-fuel/15 text-fuel-dark dark:bg-fuel/20 dark:text-fuel',
    personal: 'bg-personal/10 text-personal dark:bg-personal/20 dark:text-personal-light',
    neutral: 'bg-black/5 text-text-secondary-light dark:bg-white/10 dark:text-text-secondary-dark',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border-light dark:border-border-dark bg-surface-light/40 dark:bg-surface-dark/40 my-4">
      <div className={`p-4 rounded-2xl mb-3.5 ${iconVariants[variant]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-sm sm:text-base font-bold text-text-primary-light dark:text-text-primary-dark">
        {title}
      </h3>
      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          size="sm"
          variant={variant === 'fuel' ? 'fuel' : variant === 'personal' ? 'personal' : 'primary'}
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
