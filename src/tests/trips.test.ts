import { describe, it, expect } from 'vitest';
import { calculateTripMetrics, aggregateTrips } from '../lib/calculations/trips';
import { Trip } from '../types/database';

describe('Trip Calculations Engine', () => {
  it('calculates distance, duration, tips, and earnings correctly', () => {
    const trip: Partial<Trip> = {
      start_odometer: 1000,
      end_odometer: 1025.5,
      start_time: '2025-01-01T08:00:00Z',
      end_time: '2025-01-01T09:30:00Z', // 90 minutes
      fare_earnings: 250,
      tips: 50,
      earnings: 300,
    };

    const metrics = calculateTripMetrics(trip);
    expect(metrics.distanceKm).toBe(25.5);
    expect(metrics.durationMinutes).toBe(90);
    expect(metrics.totalEarnings).toBe(300);
    // 300 / 25.5 = 11.76 / km
    expect(metrics.earningsPerKm).toBe(11.76);
    // 300 / 1.5 hr = 200 / hr
    expect(metrics.earningsPerHour).toBe(200);
  });

  it('safely handles zero-distance trip without division-by-zero error', () => {
    const trip: Partial<Trip> = {
      start_odometer: 1000,
      end_odometer: 1000,
      start_time: '2025-01-01T08:00:00Z',
      end_time: '2025-01-01T08:10:00Z',
      fare_earnings: 0,
      tips: 0,
      earnings: 0,
    };

    const metrics = calculateTripMetrics(trip);
    expect(metrics.distanceKm).toBe(0);
    expect(metrics.earningsPerKm).toBeNull();
  });

  it('aggregates Rapido and Personal trips separately without mixing', () => {
    const trips: Trip[] = [
      {
        id: 't1',
        user_id: 'u1',
        vehicle_id: 'v1',
        trip_type: 'rapido',
        status: 'completed',
        start_odometer: 1000,
        end_odometer: 1050, // 50 km
        start_time: '2025-01-01T08:00:00Z',
        end_time: '2025-01-01T10:00:00Z',
        fare_earnings: 450,
        tips: 50,
        earnings: 500,
        ride_count: 5,
        purpose: null,
        notes: null,
        created_at: '2025-01-01T08:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 't2',
        user_id: 'u1',
        vehicle_id: 'v1',
        trip_type: 'personal',
        status: 'completed',
        start_odometer: 1050,
        end_odometer: 1070, // 20 km
        start_time: '2025-01-01T11:00:00Z',
        end_time: '2025-01-01T12:00:00Z',
        fare_earnings: 0,
        tips: 0,
        earnings: 0,
        ride_count: null,
        purpose: 'Shopping',
        notes: null,
        created_at: '2025-01-01T11:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    ];

    const summary = aggregateTrips(trips);
    expect(summary.rapido.totalDistanceKm).toBe(50);
    expect(summary.rapido.totalEarnings).toBe(500);
    expect(summary.rapido.totalFareEarnings).toBe(450);
    expect(summary.rapido.totalTips).toBe(50);
    expect(summary.personal.totalDistanceKm).toBe(20);
    expect(summary.totalDistanceKm).toBe(70);
  });
});
