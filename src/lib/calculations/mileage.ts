import { FuelEntry, MileageCycle } from '@/types/database';
import { generateUUID } from '@/lib/utils/uuid';

export interface MileageCalculationResult {
  cycles: MileageCycle[];
  latestCycle: MileageCycle | null;
  overallAverageKmpl: number | null; // weighted average
  bestKmpl: number | null;
  worstKmpl: number | null;
  measurementStatus: 'measured' | 'awaiting_next_full_tank' | 'no_measurement_yet';
  pendingCycle: {
    startFuelEntry: FuelEntry;
    accumulatedLitres: number;
    partialFillCount: number;
  } | null;
}

/**
 * Recomputes all full-tank to full-tank cycles from a list of fuel entries.
 *
 * Rules:
 * 1. Entries are sorted chronologically by odometer and recorded_at.
 * 2. A 'full' tank refill establishes a starting reference.
 * 3. All subsequent 'partial' fills accumulate fuel consumed.
 * 4. The next 'full' tank refill completes the cycle:
 *      Distance = Closing Full Odometer - Starting Reference Odometer
 *      Fuel Consumed = Sum of all intermediate partial fills + Closing Full Fill
 *      Mileage = Distance / Fuel Consumed
 * 5. The closing 'full' tank then becomes the starting reference for the next cycle.
 * 6. Entries before the very first full tank cannot form a measured cycle.
 */
export function calculateMileageCycles(
  entries: FuelEntry[],
  userId: string,
  vehicleId: string
): MileageCalculationResult {
  if (!entries || entries.length === 0) {
    return {
      cycles: [],
      latestCycle: null,
      overallAverageKmpl: null,
      bestKmpl: null,
      worstKmpl: null,
      measurementStatus: 'no_measurement_yet',
      pendingCycle: null,
    };
  }

  // Sort entries ascending by odometer, then recorded_at
  const sorted = [...entries].sort((a, b) => {
    if (a.odometer !== b.odometer) return a.odometer - b.odometer;
    return new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime();
  });

  const cycles: MileageCycle[] = [];
  let referenceFill: FuelEntry | null = null;
  let intermediateLitres = 0;
  let partialFillCount = 0;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];

    if (entry.fill_type === 'full') {
      if (referenceFill === null) {
        // First full tank ever encountered: acts as baseline reference
        referenceFill = entry;
        intermediateLitres = 0;
        partialFillCount = 0;
      } else {
        // Closing full tank!
        const distance = Number((entry.odometer - referenceFill.odometer).toFixed(2));
        const totalFuelConsumed = Number((intermediateLitres + entry.quantity_litres).toFixed(3));

        // Validation: distance > 0, fuel > 0
        const isValid = distance > 0 && totalFuelConsumed > 0;
        const kmpl = isValid ? Number((distance / totalFuelConsumed).toFixed(2)) : 0;

        // Check for anomalies (e.g., > 100 km/l or < 5 km/l for a 110cc scooter)
        const isReasonable = isValid && kmpl >= 5 && kmpl <= 95;

        const cycle: MileageCycle = {
          id: generateUUID(),
          user_id: userId,
          vehicle_id: vehicleId,
          start_fuel_entry_id: referenceFill.id,
          end_fuel_entry_id: entry.id,
          start_odometer: referenceFill.odometer,
          end_odometer: entry.odometer,
          distance_km: distance,
          fuel_consumed_litres: totalFuelConsumed,
          mileage_kmpl: kmpl,
          status: isReasonable ? 'completed' : 'invalid',
          created_at: entry.recorded_at,
          updated_at: entry.recorded_at,
        };

        cycles.push(cycle);

        // This closing fill now becomes the new starting reference
        referenceFill = entry;
        intermediateLitres = 0;
        partialFillCount = 0;
      }
    } else {
      // Partial fill: accumulate only if we already have an active full tank reference
      if (referenceFill !== null) {
        intermediateLitres += entry.quantity_litres;
        partialFillCount++;
      }
    }
  }

  // Filter valid completed cycles
  const validCycles = cycles.filter((c) => c.status === 'completed');

  let overallAverageKmpl: number | null = null;
  let bestKmpl: number | null = null;
  let worstKmpl: number | null = null;

  if (validCycles.length > 0) {
    const totalDistance = validCycles.reduce((sum, c) => sum + c.distance_km, 0);
    const totalFuel = validCycles.reduce((sum, c) => sum + c.fuel_consumed_litres, 0);
    if (totalFuel > 0) {
      overallAverageKmpl = Number((totalDistance / totalFuel).toFixed(2));
    }

    const kmplValues = validCycles.map((c) => c.mileage_kmpl);
    bestKmpl = Math.max(...kmplValues);
    worstKmpl = Math.min(...kmplValues);
  }

  let measurementStatus: 'measured' | 'awaiting_next_full_tank' | 'no_measurement_yet';
  if (validCycles.length > 0) {
    measurementStatus = 'measured';
  } else if (referenceFill !== null) {
    measurementStatus = 'awaiting_next_full_tank';
  } else {
    measurementStatus = 'no_measurement_yet';
  }

  const latestCycle = validCycles.length > 0 ? validCycles[validCycles.length - 1] : null;

  const pendingCycle = referenceFill
    ? {
        startFuelEntry: referenceFill,
        accumulatedLitres: Number(intermediateLitres.toFixed(3)),
        partialFillCount,
      }
    : null;

  return {
    cycles,
    latestCycle,
    overallAverageKmpl,
    bestKmpl,
    worstKmpl,
    measurementStatus,
    pendingCycle,
  };
}

/**
 * Calculates fuel cost per kilometre based on measured mileage and fuel price.
 */
export function calculateFuelCostPerKm(
  mileageKmpl: number | null | undefined,
  fuelPricePerLitre: number | null | undefined
): number | null {
  if (!mileageKmpl || mileageKmpl <= 0 || !fuelPricePerLitre || fuelPricePerLitre <= 0) {
    return null;
  }
  return Number((fuelPricePerLitre / mileageKmpl).toFixed(2));
}

