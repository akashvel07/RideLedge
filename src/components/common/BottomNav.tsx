import React from 'react';
import { LayoutDashboard, MapPin, Fuel, Wrench, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type NavTab = 'dashboard' | 'trips' | 'fuel' | 'service' | 'insights' | 'settings';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'trips', label: 'Trips', icon: MapPin },
    { id: 'fuel', label: 'Fuel', icon: Fuel },
    { id: 'service', label: 'Service', icon: Wrench },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-border-light dark:border-border-dark pb-safe">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as NavTab)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors relative',
                isActive
                  ? 'text-forest dark:text-forest-light'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark'
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-forest rounded-full" />
              )}
              <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110 stroke-[2.2]')} />
              <span className={cn('text-[11px] font-medium tracking-tight', isActive && 'font-bold')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
