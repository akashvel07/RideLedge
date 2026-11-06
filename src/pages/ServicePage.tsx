import React, { useMemo } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { formatCurrency, formatDistance, formatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Wrench,
  Plus,
  Bell,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface ServicePageProps {
  onAddService: () => void;
  onAddReminder: () => void;
}

export const ServicePage: React.FC<ServicePageProps> = ({ onAddService, onAddReminder }) => {
  const {
    currentOdometer,
    serviceStatus,
    serviceRecords,
    reminders,
    deleteService,
    toggleReminder,
    deleteReminder,
  } = useVehicle();

  // Total spent on maintenance
  const totalServiceSpent = useMemo(() => {
    return serviceRecords.reduce((sum, s) => sum + s.amount, 0);
  }, [serviceRecords]);

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Delete this service record?')) {
      await deleteService(id);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(id);
  };

  return (
    <div className="space-y-5 pb-8 animate-in fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            Service & Maintenance
          </h2>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Track engine oil changes, regular servicing, and document renewals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={onAddReminder} variant="outline" size="md" className="gap-1.5 text-xs">
            <Bell className="w-4 h-4 text-warning" />
            Set Reminder
          </Button>
          <Button onClick={onAddService} variant="primary" size="md" className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            Add Service Record
          </Button>
        </div>
      </div>

      {/* Main Countdown Status Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border-light dark:border-border-dark">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
              Upcoming Service Health
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-text-primary-light dark:text-text-primary-dark">
                {serviceStatus.remainingKm !== null
                  ? formatDistance(serviceStatus.remainingKm, 1)
                  : 'No Target Set'}
              </span>
              {serviceStatus.remainingKm !== null && (
                <span className="text-xs font-semibold text-text-secondary-light">
                  remaining
                </span>
              )}
            </div>
          </div>

          <Badge
            variant={
              serviceStatus.status === 'overdue'
                ? 'danger'
                : serviceStatus.status === 'due_soon'
                ? 'warning'
                : 'forest'
            }
            size="md"
          >
            {serviceStatus.statusLabel}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block">
              Current Odometer
            </span>
            <span className="font-bold text-text-primary-light dark:text-text-primary-dark text-sm">
              {formatDistance(currentOdometer, 1)}
            </span>
          </div>

          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block">
              Last Service Odo
            </span>
            <span className="font-semibold text-text-primary-light dark:text-text-primary-dark text-sm">
              {serviceStatus.lastServiceOdometer
                ? formatDistance(serviceStatus.lastServiceOdometer, 1)
                : 'None recorded'}
            </span>
          </div>

          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block">
              Next Target Odo
            </span>
            <span className="font-bold text-forest text-sm">
              {serviceStatus.nextServiceOdometer
                ? formatDistance(serviceStatus.nextServiceOdometer, 1)
                : '--'}
            </span>
          </div>

          <div>
            <span className="text-text-secondary-light dark:text-text-secondary-dark block">
              Total Spent on Service
            </span>
            <span className="font-bold text-text-primary-light dark:text-text-primary-dark text-sm">
              {formatCurrency(totalServiceSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Reminders Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-warning" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
              Active Alerts & Document Reminders
            </h3>
          </div>
          <button
            onClick={onAddReminder}
            className="text-xs font-semibold text-forest dark:text-forest-light hover:underline"
          >
            + Add
          </button>
        </div>

        {reminders.length > 0 ? (
          <div className="divide-y divide-border-light dark:divide-border-dark mt-2">
            {reminders.map((rem) => (
              <div key={rem.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleReminder(rem.id, !rem.is_completed)}
                    className={`p-1 rounded-full transition-colors ${
                      rem.is_completed
                        ? 'text-forest bg-forest/10'
                        : 'text-text-secondary-light hover:text-forest'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>

                  <div>
                    <span
                      className={`font-semibold text-sm ${
                        rem.is_completed
                          ? 'line-through text-text-secondary-light'
                          : 'text-text-primary-light dark:text-text-primary-dark'
                      }`}
                    >
                      {rem.title}
                    </span>
                    <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                      {rem.target_odometer && `Target: ${formatDistance(rem.target_odometer, 1)}`}
                      {rem.target_date && ` • Expiry: ${formatDate(rem.target_date)}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteReminder(rem.id)}
                  className="p-1 text-text-secondary-light hover:text-danger rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary-light text-center py-4">
            No active reminders. Add one for insurance renewal, PUC, or next oil change!
          </p>
        )}
      </div>

      {/* Service Records History */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark">
          Service History & Logs
        </h3>

        {serviceRecords.length > 0 ? (
          <div className="space-y-2.5">
            {serviceRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-sm flex items-start justify-between text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-forest/10 text-forest shrink-0 mt-0.5">
                    <Wrench className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-text-primary-light dark:text-text-primary-dark">
                        {record.category}
                      </span>
                      <span className="text-[11px] text-text-secondary-light">
                        {formatDate(record.service_date)}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                      Odometer: <strong>{formatDistance(record.odometer, 1)}</strong>
                      {record.workshop_name && ` • Workshop: ${record.workshop_name}`}
                    </p>

                    {record.description && (
                      <p className="text-xs text-text-primary-light/90 dark:text-text-primary-dark/90 mt-1.5">
                        {record.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-danger dark:text-danger-light">
                    {formatCurrency(record.amount)}
                  </span>

                  <button
                    onClick={() => handleDeleteService(record.id)}
                    className="p-1 text-text-secondary-light hover:text-danger rounded"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Wrench}
            title="No Service Records"
            description="Keep track of engine oil replacements, brake servicing, and workshop bills."
            actionLabel="Add First Service Record"
            onAction={onAddService}
            variant="neutral"
          />
        )}
      </div>
    </div>
  );
};
