import { describe, it, expect } from 'vitest';
import { calculateMileageCycles } from '../lib/calculations/mileage';
import { FuelEntry } from '../types/database';

describe('Full-Tank-to-Full-Tank Mileage Engine', () => {
  const userId = 'user-1';
  const vehicleId = 'vehicle-1';

  it('handles empty entries gracefully', () => {
    const result = calculateMileageCycles([], userId, vehicleId);
    expect(result.cycles).toHaveLength(0);
    expect(result.measurementStatus).toBe('no_measurement_yet');
    expect(result.overallAverageKmpl).toBeNull();
  });

  it('correctly calculates mileage with full-tank reference, intermediate partials, and closing full tank', () => {
    // Example from specification:
    // Initial full-tank: 10,000 km
    // Partial: 2 litres
    // Partial: 1 litre
    // Closing full-tank: 10,150 km, filled: 3 litres
    // Distance = 150 km, Fuel = 2 + 1 + 3 = 6 litres, Mileage = 150 / 6 = 25 km/l
    const entries: FuelEntry[] = [
      {
        id: 'f1',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-01T10:00:00Z',
        odometer: 10000,
        price_per_litre: 102.5,
        quantity_litres: 5.0, // initial reference tank fill - should NOT be counted in cycle fuel!
        total_amount: 512.5,
        fill_type: 'full',
        station_name: 'HP',
        notes: null,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 'f2',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-03T10:00:00Z',
        odometer: 10050,
        price_per_litre: 102.5,
        quantity_litres: 2.0,
        total_amount: 205.0,
        fill_type: 'partial',
        station_name: 'HP',
        notes: null,
        created_at: '2025-01-03T10:00:00Z',
        updated_at: '2025-01-03T10:00:00Z',
      },
      {
        id: 'f3',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-05T10:00:00Z',
        odometer: 10090,
        price_per_litre: 102.5,
        quantity_litres: 1.0,
        total_amount: 102.5,
        fill_type: 'partial',
        station_name: 'HP',
        notes: null,
        created_at: '2025-01-05T10:00:00Z',
        updated_at: '2025-01-05T10:00:00Z',
      },
      {
        id: 'f4',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-08T10:00:00Z',
        odometer: 10150,
        price_per_litre: 102.5,
        quantity_litres: 3.0,
        total_amount: 307.5,
        fill_type: 'full',
        station_name: 'HP',
        notes: null,
        created_at: '2025-01-08T10:00:00Z',
        updated_at: '2025-01-08T10:00:00Z',
      },
    ];

    const result = calculateMileageCycles(entries, userId, vehicleId);
    expect(result.cycles).toHaveLength(1);
    const cycle = result.cycles[0];
    expect(cycle.distance_km).toBe(150);
    expect(cycle.fuel_consumed_litres).toBe(6);
    expect(cycle.mileage_kmpl).toBe(25);
    expect(cycle.status).toBe('completed');
    expect(result.measurementStatus).toBe('measured');
    expect(result.overallAverageKmpl).toBe(25);
  });

  it('keeps measurement pending when intermediate partial refill occurs after full tank', () => {
    const entries: FuelEntry[] = [
      {
        id: 'f1',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-01T10:00:00Z',
        odometer: 10000,
        price_per_litre: 102,
        quantity_litres: 5.0,
        total_amount: 510,
        fill_type: 'full',
        station_name: null,
        notes: null,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 'f2',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-03T10:00:00Z',
        odometer: 10070,
        price_per_litre: 102,
        quantity_litres: 2.0,
        total_amount: 204,
        fill_type: 'partial',
        station_name: null,
        notes: null,
        created_at: '2025-01-03T10:00:00Z',
        updated_at: '2025-01-03T10:00:00Z',
      },
    ];

    const result = calculateMileageCycles(entries, userId, vehicleId);
    expect(result.cycles).toHaveLength(0);
    expect(result.measurementStatus).toBe('awaiting_next_full_tank');
    expect(result.pendingCycle?.accumulatedLitres).toBe(2.0);
  });

  it('calculates weighted overall mileage across multiple cycles instead of simple average', () => {
    // Cycle 1: 200 km, 4 litres -> 50 km/l
    // Cycle 2: 100 km, 2.5 litres -> 40 km/l
    // Simple average would be (50 + 40) / 2 = 45 km/l
    // Weighted average: (200 + 100) / (4 + 2.5) = 300 / 6.5 = 46.15 km/l
    const entries: FuelEntry[] = [
      {
        id: 'f1',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-01T10:00:00Z',
        odometer: 5000,
        price_per_litre: 100,
        quantity_litres: 5.0,
        total_amount: 500,
        fill_type: 'full',
        station_name: null,
        notes: null,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 'f2',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-05T10:00:00Z',
        odometer: 5200,
        price_per_litre: 100,
        quantity_litres: 4.0,
        total_amount: 400,
        fill_type: 'full',
        station_name: null,
        notes: null,
        created_at: '2025-01-05T10:00:00Z',
        updated_at: '2025-01-05T10:00:00Z',
      },
      {
        id: 'f3',
        user_id: userId,
        vehicle_id: vehicleId,
        odometer_entry_id: null,
        recorded_at: '2025-01-10T10:00:00Z',
        odometer: 5300,
        price_per_litre: 100,
        quantity_litres: 2.5,
        total_amount: 250,
        fill_type: 'full',
        station_name: null,
        notes: null,
        created_at: '2025-01-10T10:00:00Z',
        updated_at: '2025-01-10T10:00:00Z',
      },
    ];

    const result = calculateMileageCycles(entries, userId, vehicleId);
    expect(result.cycles).toHaveLength(2);
    expect(result.overallAverageKmpl).toBe(46.15);
    expect(result.bestKmpl).toBe(50);
    expect(result.worstKmpl).toBe(40);
  });
});

