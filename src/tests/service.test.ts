import { describe, it, expect } from 'vitest';
import { calculateServiceStatus } from '../lib/calculations/service';
import { ServiceRecord, Reminder } from '../types/database';

describe('Service & Maintenance Engine', () => {
  it('correctly calculates remaining kilometres and status as On Track', () => {
    const records: ServiceRecord[] = [
      {
        id: 's1',
        user_id: 'u1',
        vehicle_id: 'v1',
        service_date: '2025-01-01',
        odometer: 10000,
        category: 'Engine oil',
        description: 'Oil changed',
        workshop_name: 'TVS Service',
        amount: 450,
        next_service_odometer: 13000,
        receipt_path: null,
        notes: null,
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    ];

    const currentOdo = 11500;
    const result = calculateServiceStatus(currentOdo, records, [], 200);

    expect(result.remainingKm).toBe(1500);
    expect(result.status).toBe('on_track');
    expect(result.statusLabel).toBe('On Track');
  });

  it('marks service as Upcoming when within threshold', () => {
    const records: ServiceRecord[] = [
      {
        id: 's1',
        user_id: 'u1',
        vehicle_id: 'v1',
        service_date: '2025-01-01',
        odometer: 10000,
        category: 'General servicing',
        description: null,
        workshop_name: null,
        amount: 800,
        next_service_odometer: 13000,
        receipt_path: null,
        notes: null,
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    ];

    const currentOdo = 12850; // 150 km left (< 200 threshold)
    const result = calculateServiceStatus(currentOdo, records, [], 200);

    expect(result.remainingKm).toBe(150);
    expect(result.status).toBe('upcoming');
  });

  it('marks service as Due Soon when under 100 km', () => {
    const records: ServiceRecord[] = [
      {
        id: 's1',
        user_id: 'u1',
        vehicle_id: 'v1',
        service_date: '2025-01-01',
        odometer: 10000,
        category: 'Engine oil',
        description: null,
        workshop_name: null,
        amount: 450,
        next_service_odometer: 13000,
        receipt_path: null,
        notes: null,
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    ];

    const currentOdo = 12940; // 60 km left
    const result = calculateServiceStatus(currentOdo, records, [], 200);

    expect(result.remainingKm).toBe(60);
    expect(result.status).toBe('due_soon');
  });

  it('marks service as Overdue when current odometer exceeds target', () => {
    const records: ServiceRecord[] = [
      {
        id: 's1',
        user_id: 'u1',
        vehicle_id: 'v1',
        service_date: '2025-01-01',
        odometer: 10000,
        category: 'Engine oil',
        description: null,
        workshop_name: null,
        amount: 450,
        next_service_odometer: 13000,
        receipt_path: null,
        notes: null,
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    ];

    const currentOdo = 13050; // -50 km overdue
    const result = calculateServiceStatus(currentOdo, records, [], 200);

    expect(result.remainingKm).toBe(-50);
    expect(result.status).toBe('overdue');
    expect(result.statusLabel).toBe('Service Overdue');
  });

  it('handles active reminders with closer targets', () => {
    const reminders: Reminder[] = [
      {
        id: 'r1',
        user_id: 'u1',
        vehicle_id: 'v1',
        reminder_type: 'service',
        title: 'Brake pads replacement',
        target_odometer: 12000,
        target_date: null,
        threshold_km: 200,
        is_completed: false,
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    ];

    const result = calculateServiceStatus(11850, [], reminders, 200);
    expect(result.nextServiceOdometer).toBe(12000);
    expect(result.remainingKm).toBe(150);
    expect(result.status).toBe('upcoming');
  });
});
