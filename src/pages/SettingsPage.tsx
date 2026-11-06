import React, { useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Moon,
  Sun,
  Monitor,
  Download,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { getDB } from '@/lib/offline/db';

export const SettingsPage: React.FC = () => {
  const { currentVehicle, updateVehicle, settings, updateSettings } = useVehicle();
  const { theme, setTheme } = useTheme();
  const { isConfigured } = useAuth();

  // Vehicle form
  const [name, setName] = useState<string>(currentVehicle?.name || 'TVS Jupiter 110');
  const [registration, setRegistration] = useState<string>(currentVehicle?.registration_number || '');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Settings
  const [maintenanceEnabled, setMaintenanceEnabled] = useState<boolean>(
    settings?.maintenance_allocation_enabled ?? true
  );
  const [maintenanceRate, setMaintenanceRate] = useState<string>(
    (settings?.maintenance_rate_per_km ?? 0.5).toString()
  );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) return;

    await updateVehicle(currentVehicle.id, {
      name,
      registration_number: registration || null,
    });

    await updateSettings({
      maintenance_allocation_enabled: maintenanceEnabled,
      maintenance_rate_per_km: parseFloat(maintenanceRate) || 0.5,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const exportAllDataJSON = async () => {
    const db = await getDB();
    const allData = {
      vehicles: await db.getAll('vehicles'),
      trips: await db.getAll('trips'),
      fuel_entries: await db.getAll('fuel_entries'),
      mileage_cycles: await db.getAll('mileage_cycles'),
      service_records: await db.getAll('service_records'),
      expenses: await db.getAll('expenses'),
      reminders: await db.getAll('reminders'),
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rideledger_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
          Vehicle Profile & Settings
        </h2>
        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Manage your TVS Jupiter specs, theme preferences, and profit calculations.
        </p>
      </div>

      {/* 1. VEHICLE PROFILE */}
      <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-forest" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
              Vehicle Specifications
            </h3>
          </div>
          <span className="text-[11px] text-forest font-semibold">TVS Jupiter 110 (Petrol)</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Manufacturer"
            type="text"
            disabled
            value={currentVehicle?.manufacturer || 'TVS'}
          />
          <Input
            label="Model"
            type="text"
            disabled
            value={currentVehicle?.model || 'Jupiter 110'}
          />
        </div>

        <Input
          label="Vehicle Nickname"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Input
          label="Registration Number (Optional)"
          type="text"
          placeholder="e.g. KA-01-AB-1234"
          value={registration}
          onChange={(e) => setRegistration(e.target.value)}
        />

        {/* 2. PROFITABILITY CALCULATIONS */}
        <div className="pt-3 border-t border-border-light dark:border-border-dark space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
            Rapido Profit Calculation Settings
          </h4>

          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold block text-text-primary-light dark:text-text-primary-dark">
                Include Maintenance Wear Allocation
              </span>
              <span className="text-text-secondary-light text-[11px]">
                Deducts estimated wear & tear (₹/km) from gross Rapido earnings.
              </span>
            </div>
            <input
              type="checkbox"
              checked={maintenanceEnabled}
              onChange={(e) => setMaintenanceEnabled(e.target.checked)}
              className="w-4 h-4 text-forest rounded focus:ring-forest accent-forest"
            />
          </div>

          {maintenanceEnabled && (
            <Input
              label="Maintenance Rate / km"
              type="number"
              step="0.05"
              prefixText="₹"
              suffixText="/ km"
              value={maintenanceRate}
              onChange={(e) => setMaintenanceRate(e.target.value)}
              hint="Recommended for 110cc scooter: ₹0.50 per km"
            />
          )}
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-forest/10 border border-forest/20 text-forest text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Profile and settings saved successfully!</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button type="submit" variant="primary" size="md">
            Save Changes
          </Button>
        </div>
      </form>

      {/* 3. THEME SELECTION */}
      <div className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
          Theme & Display
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
              theme === 'light'
                ? 'bg-forest text-white border-forest shadow-sm'
                : 'bg-black/5 dark:bg-white/5 border-border-light text-text-secondary-light'
            }`}
          >
            <Sun className="w-4 h-4" />
            Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
              theme === 'dark'
                ? 'bg-forest text-white border-forest shadow-sm'
                : 'bg-black/5 dark:bg-white/5 border-border-light text-text-secondary-light'
            }`}
          >
            <Moon className="w-4 h-4" />
            Dark
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
              theme === 'system'
                ? 'bg-forest text-white border-forest shadow-sm'
                : 'bg-black/5 dark:bg-white/5 border-border-light text-text-secondary-light'
            }`}
          >
            <Monitor className="w-4 h-4" />
            System
          </button>
        </div>
      </div>

      {/* 4. SUPABASE BACKEND STATUS & BACKUP */}
      <div className="p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-forest" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
              Backend & Storage
            </h3>
          </div>
          {isConfigured ? (
            <Badge variant="forest" size="sm">
              Supabase Connected
            </Badge>
          ) : (
            <Badge variant="warning" size="sm">
              Local-First Offline Mode
            </Badge>
          )}
        </div>

        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
          {isConfigured
            ? 'Your application is connected to Supabase PostgreSQL. Offline changes are cached in IndexedDB and synchronized automatically when online.'
            : 'RideLedger is currently operating in high-performance local-first mode with IndexedDB. Add your Supabase credentials in .env to enable multi-device cloud synchronization.'}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            onClick={exportAllDataJSON}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-2 text-xs"
          >
            <Download className="w-4 h-4" />
            Export Database Backup (.JSON)
          </Button>

          <div className="flex items-center gap-1.5 text-xs text-forest dark:text-forest-light font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Multi-Device Cloud Sync Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
};
