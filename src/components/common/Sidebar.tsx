import React from 'react';
import { LayoutDashboard, MapPin, Fuel, Wrench, BarChart3, Settings, ShieldCheck, Gauge } from 'lucide-react';
import { NavTab } from './BottomNav';
import { cn } from '@/lib/utils/cn';
import { useVehicle } from '@/context/VehicleContext';
import { formatDistance } from '@/lib/utils/formatters';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { currentVehicle, currentOdometer } = useVehicle();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trips', label: 'Trips & Rapido', icon: MapPin },
    { id: 'fuel', label: 'Fuel & Mileage', icon: Fuel },
    { id: 'service', label: 'Service & Maintenance', icon: Wrench },
    { id: 'insights', label: 'Insights & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Vehicle Profile & Settings', icon: Settings },
  ] as const;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark p-5 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-forest flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-forest/20">
          RL
        </div>
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            RideLedger
          </h2>
          <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark font-medium leading-none">
            Bike & Rapido Tracker
          </p>
        </div>
      </div>

      {/* Vehicle Info Card */}
      {currentVehicle && (
        <div className="mb-6 p-3.5 rounded-xl bg-forest-light/60 dark:bg-forest-dark/20 border border-forest/15">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-forest dark:text-forest-light">
              {currentVehicle.manufacturer} {currentVehicle.model}
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-forest" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 text-text-primary-light dark:text-text-primary-dark">
            <Gauge className="w-3.5 h-3.5 text-text-secondary-light dark:text-text-secondary-dark" />
            <span className="text-sm font-bold">{formatDistance(currentOdometer, 1)}</span>
            <span className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">odometer</span>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as NavTab)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                isActive
                  ? 'bg-forest text-white font-semibold shadow-sm'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-current')} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Tagline */}
      <div className="pt-4 border-t border-border-light dark:border-border-dark text-[11px] text-text-secondary-light dark:text-text-secondary-dark px-2">
        <p className="font-medium text-forest dark:text-forest-light">Your bike. Your fuel.</p>
        <p>Your actual earnings.</p>
      </div>
    </aside>
  );
};
