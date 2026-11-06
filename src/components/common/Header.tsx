import React from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { useAuth } from '@/context/AuthContext';
import { formatDistance } from '@/lib/utils/formatters';
import { Settings, Gauge, Wifi, WifiOff, RefreshCw, Download } from 'lucide-react';
import { useSync } from '@/context/SyncContext';
import { usePWA } from '@/context/PWAContext';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenAuth }) => {
  const { currentVehicle, currentOdometer } = useVehicle();
  const { user } = useAuth();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useSync();
  const { isInstallable, isStandalone, promptInstall } = usePWA();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-border-light dark:border-border-dark px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Greeting & Vehicle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAuth}
            className="w-9 h-9 rounded-xl bg-forest/10 dark:bg-forest/20 flex items-center justify-center text-forest dark:text-forest-light font-bold text-base shadow-inner hover:bg-forest/20 transition-colors"
            title="User Profile / Sign In"
          >
            RL
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark font-medium">
                {getGreeting()}{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight leading-none">
              {currentVehicle ? `${currentVehicle.manufacturer} ${currentVehicle.model}` : 'RideLedger'}
            </h1>
          </div>
        </div>

        {/* Right: Odometer pill + Sync + Settings */}
        <div className="flex items-center gap-2">
          {/* Current Odometer Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-border-light dark:border-border-dark text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
            <Gauge className="w-3.5 h-3.5 text-forest" />
            <span>{formatDistance(currentOdometer, 1)}</span>
          </div>

          {/* Sync indicator */}
          <button
            onClick={triggerSync}
            title={
              !isOnline
                ? 'Offline mode (Changes saved locally)'
                : pendingCount > 0
                ? `${pendingCount} changes waiting to sync. Click to sync now.`
                : 'All changes synced'
            }
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors bg-surface-light dark:bg-surface-dark"
          >
            {!isOnline ? (
              <span className="flex items-center gap-1 text-danger">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </span>
            ) : isSyncing ? (
              <span className="flex items-center gap-1 text-forest animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Syncing</span>
              </span>
            ) : pendingCount > 0 ? (
              <span className="flex items-center gap-1 text-warning">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{pendingCount}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-forest">
                <Wifi className="w-3.5 h-3.5" />
              </span>
            )}
          </button>

          {/* Install PWA Button if available */}
          {isInstallable && !isStandalone && (
            <Button
              onClick={promptInstall}
              variant="secondary"
              size="sm"
              className="hidden sm:inline-flex gap-1.5 text-xs font-bold bg-forest-light text-forest dark:bg-forest-dark/30 dark:text-forest-light"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </Button>
          )}

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Settings & Vehicle Profile"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
