import { ServiceRecord, Reminder } from '@/types/database';

export type ServiceStatusType = 'on_track' | 'upcoming' | 'due_soon' | 'overdue' | 'no_target';

export interface ServiceStatusResult {
  currentOdometer: number;
  lastServiceOdometer: number | null;
  lastServiceDate: string | null;
  nextServiceOdometer: number | null;
  remainingKm: number | null;
  status: ServiceStatusType;
  statusLabel: string;
}

/**
 * Calculates current service health and countdown
 */
export function calculateServiceStatus(
  currentOdometer: number,
  serviceRecords: ServiceRecord[],
  activeReminders: Reminder[],
  thresholdKm: number = 200
): ServiceStatusResult {
  // Sort records descending by date / odometer
  const sorted = [...serviceRecords].sort((a, b) => {
    return new Date(b.service_date).getTime() - new Date(a.service_date).getTime();
  });

  const latestRecord = sorted.length > 0 ? sorted[0] : null;
  const lastServiceOdometer = latestRecord ? latestRecord.odometer : null;
  const lastServiceDate = latestRecord ? latestRecord.service_date : null;

  // Next service target may come from latest service record's next_service_odometer
  // or from a specific service reminder
  let nextServiceOdometer: number | null = latestRecord?.next_service_odometer ?? null;

  // Look for any uncompleted service reminders with a target odometer
  const serviceReminders = activeReminders.filter(
    (r) => !r.is_completed && r.target_odometer && r.target_odometer > 0
  );

  if (serviceReminders.length > 0) {
    const minReminderOdo = Math.min(...serviceReminders.map((r) => r.target_odometer!));
    if (!nextServiceOdometer || minReminderOdo < nextServiceOdometer) {
      nextServiceOdometer = minReminderOdo;
    }
  }

  if (!nextServiceOdometer) {
    return {
      currentOdometer,
      lastServiceOdometer,
      lastServiceDate,
      nextServiceOdometer: null,
      remainingKm: null,
      status: 'no_target',
      statusLabel: 'No Target Set',
    };
  }

  const remainingKm = Number((nextServiceOdometer - currentOdometer).toFixed(1));

  let status: ServiceStatusType;
  let statusLabel: string;

  if (remainingKm <= 0) {
    status = 'overdue';
    statusLabel = 'Service Overdue';
  } else if (remainingKm <= 100) {
    status = 'due_soon';
    statusLabel = 'Due Soon';
  } else if (remainingKm <= thresholdKm) {
    status = 'upcoming';
    statusLabel = 'Upcoming';
  } else {
    status = 'on_track';
    statusLabel = 'On Track';
  }

  return {
    currentOdometer,
    lastServiceOdometer,
    lastServiceDate,
    nextServiceOdometer,
    remainingKm,
    status,
    statusLabel,
  };
}

