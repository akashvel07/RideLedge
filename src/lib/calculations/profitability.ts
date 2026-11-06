export interface ProfitabilityInput {
  rapidoDistanceKm: number;
  rapidoEarnings: number; // base fare + tips
  rapidoFareEarnings: number;
  rapidoTips: number;
  rapidoWorkingHours: number;
  measuredMileageKmpl: number | null | undefined;
  fuelPricePerLitre: number | null | undefined;
  maintenanceAllocationEnabled: boolean;
  maintenanceRatePerKm?: number; // default ₹0.50 / km
}

export interface ProfitabilityResult {
  hasSufficientData: boolean;
  missingDataReasons: string[];
  totalEarnings: number;
  fareEarnings: number;
  tips: number;
  rapidoDistanceKm: number;
  workingHours: number;
  earningsPerKm: number | null;
  earningsPerHour: number | null;
  estimatedFuelCost: number | null;
  estimatedMaintenanceAllocation: number | null;
  estimatedNetEarnings: number | null;
  profitMarginPercent: number | null;
}

/**
 * Calculates Rapido profitability metrics with clear separation of recorded and estimated figures.
 */
export function calculateProfitability(input: ProfitabilityInput): ProfitabilityResult {
  const {
    rapidoDistanceKm,
    rapidoEarnings,
    rapidoFareEarnings,
    rapidoTips,
    rapidoWorkingHours,
    measuredMileageKmpl,
    fuelPricePerLitre,
    maintenanceAllocationEnabled,
    maintenanceRatePerKm = 0.50,
  } = input;

  const missingDataReasons: string[] = [];

  if (!measuredMileageKmpl || measuredMileageKmpl <= 0) {
    missingDataReasons.push('Measured mileage not available yet (requires full-tank cycle)');
  }

  if (!fuelPricePerLitre || fuelPricePerLitre <= 0) {
    missingDataReasons.push('Fuel price per litre not available');
  }

  const earningsPerKm =
    rapidoDistanceKm > 0 ? Number((rapidoEarnings / rapidoDistanceKm).toFixed(2)) : null;

  const earningsPerHour =
    rapidoWorkingHours > 0 ? Number((rapidoEarnings / rapidoWorkingHours).toFixed(2)) : null;

  let estimatedFuelCost: number | null = null;
  let estimatedMaintenanceAllocation: number | null = null;
  let estimatedNetEarnings: number | null = null;
  let profitMarginPercent: number | null = null;

  const canEstimateFuel = Boolean(
    measuredMileageKmpl && measuredMileageKmpl > 0 && fuelPricePerLitre && fuelPricePerLitre > 0
  );

  if (canEstimateFuel) {
    // Fuel cost = (Distance / Kmpl) * Price
    estimatedFuelCost = Number(((rapidoDistanceKm / measuredMileageKmpl!) * fuelPricePerLitre!).toFixed(2));

    if (maintenanceAllocationEnabled) {
      estimatedMaintenanceAllocation = Number((rapidoDistanceKm * maintenanceRatePerKm).toFixed(2));
    } else {
      estimatedMaintenanceAllocation = 0;
    }

    const totalEstimatedDeductions = estimatedFuelCost + (estimatedMaintenanceAllocation ?? 0);
    estimatedNetEarnings = Number((rapidoEarnings - totalEstimatedDeductions).toFixed(2));

    if (rapidoEarnings > 0) {
      profitMarginPercent = Number(((estimatedNetEarnings / rapidoEarnings) * 100).toFixed(1));
    }
  }

  return {
    hasSufficientData: canEstimateFuel,
    missingDataReasons,
    totalEarnings: Number(rapidoEarnings.toFixed(2)),
    fareEarnings: Number(rapidoFareEarnings.toFixed(2)),
    tips: Number(rapidoTips.toFixed(2)),
    rapidoDistanceKm: Number(rapidoDistanceKm.toFixed(1)),
    workingHours: Number(rapidoWorkingHours.toFixed(2)),
    earningsPerKm,
    earningsPerHour,
    estimatedFuelCost,
    estimatedMaintenanceAllocation,
    estimatedNetEarnings,
    profitMarginPercent,
  };
}
