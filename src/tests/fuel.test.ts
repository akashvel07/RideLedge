import { describe, it, expect } from 'vitest';
import { calculateFuelSummary, validateFuelEntryMath } from '../lib/calculations/fuel';
import { FuelEntry } from '../types/database';

describe('Fuel Summary & Validation Engine', () => {
  it('aggregates total litres, expenditures, and weighted average price', () => {
    const entries: FuelEntry[] = [
      {
        id: 'f1',
        user_id: 'u1',
        vehicle_id: 'v1',
        odometer_entry_id: null,
        recorded_at: '2025-01-01T10:00:00Z',
        odometer: 10000,
        price_per_litre: 100,
        quantity_litres: 4,
        total_amount: 400,
        fill_type: 'full',
        station_name: 'HP',
        notes: null,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 'f2',
        user_id: 'u1',
        vehicle_id: 'v1',
        odometer_entry_id: null,
        recorded_at: '2025-01-05T10:00:00Z',
        odometer: 10150,
        price_per_litre: 105,
        quantity_litres: 2,
        total_amount: 210,
        fill_type: 'partial',
        station_name: 'IndianOil',
        notes: null,
        created_at: '2025-01-05T10:00:00Z',
        updated_at: '2025-01-05T10:00:00Z',
      },
    ];

    const summary = calculateFuelSummary(entries);
    expect(summary.totalLitres).toBe(6);
    expect(summary.totalExpenditure).toBe(610);
    // 610 / 6 = 101.67
    expect(summary.averagePricePerLitre).toBe(101.67);
    expect(summary.fillCount).toBe(2);
  });

  it('detects fuel pump rounding differences', () => {
    // 102.50 * 4.88 = 500.20, but pump receipt is ₹500
    const check1 = validateFuelEntryMath(102.5, 4.88, 500);
    expect(check1.calculatedAmount).toBe(500.2);
    expect(check1.difference).toBe(0.2);
    expect(check1.hasDiscrepancy).toBe(false); // <= 1.0 is acceptable pump rounding

    // Large discrepancy of ₹50
    const check2 = validateFuelEntryMath(100, 5, 550);
    expect(check2.calculatedAmount).toBe(500);
    expect(check2.difference).toBe(50);
    expect(check2.hasDiscrepancy).toBe(true);
  });
});

