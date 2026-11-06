import { describe, it, expect } from 'vitest';
import { calculateProfitability } from '../lib/calculations/profitability';

describe('Rapido Profitability Engine', () => {
  it('correctly calculates net earnings with fuel cost and maintenance allocation', () => {
    // 100 km Rapido distance
    // ₹1200 earnings (₹1100 fare + ₹100 tips)
    // 5 hours
    // Mileage: 40 km/l
    // Petrol price: ₹100 / L
    // Fuel cost = (100 / 40) * 100 = 2.5 * 100 = ₹250
    // Maintenance allocation = 100 km * ₹0.50/km = ₹50
    // Net earnings = 1200 - 250 - 50 = ₹900
    // Profit margin = (900 / 1200) * 100 = 75.0%
    const result = calculateProfitability({
      rapidoDistanceKm: 100,
      rapidoEarnings: 1200,
      rapidoFareEarnings: 1100,
      rapidoTips: 100,
      rapidoWorkingHours: 5,
      measuredMileageKmpl: 40,
      fuelPricePerLitre: 100,
      maintenanceAllocationEnabled: true,
      maintenanceRatePerKm: 0.5,
    });

    expect(result.hasSufficientData).toBe(true);
    expect(result.totalEarnings).toBe(1200);
    expect(result.fareEarnings).toBe(1100);
    expect(result.tips).toBe(100);
    expect(result.earningsPerKm).toBe(12);
    expect(result.earningsPerHour).toBe(240);
    expect(result.estimatedFuelCost).toBe(250);
    expect(result.estimatedMaintenanceAllocation).toBe(50);
    expect(result.estimatedNetEarnings).toBe(900);
    expect(result.profitMarginPercent).toBe(75);
  });

  it('excludes maintenance allocation when disabled in settings', () => {
    const result = calculateProfitability({
      rapidoDistanceKm: 100,
      rapidoEarnings: 1200,
      rapidoFareEarnings: 1100,
      rapidoTips: 100,
      rapidoWorkingHours: 5,
      measuredMileageKmpl: 40,
      fuelPricePerLitre: 100,
      maintenanceAllocationEnabled: false,
    });

    expect(result.estimatedMaintenanceAllocation).toBe(0);
    // Net earnings = 1200 - 250 = ₹950
    expect(result.estimatedNetEarnings).toBe(950);
  });

  it('marks data as insufficient when measured mileage is missing', () => {
    const result = calculateProfitability({
      rapidoDistanceKm: 50,
      rapidoEarnings: 600,
      rapidoFareEarnings: 550,
      rapidoTips: 50,
      rapidoWorkingHours: 2.5,
      measuredMileageKmpl: null, // no full-tank cycle yet
      fuelPricePerLitre: 102,
      maintenanceAllocationEnabled: true,
    });

    expect(result.hasSufficientData).toBe(false);
    expect(result.missingDataReasons.length).toBeGreaterThan(0);
    expect(result.estimatedFuelCost).toBeNull();
    expect(result.estimatedNetEarnings).toBeNull();
  });
});

