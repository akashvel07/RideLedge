import { FuelEntry } from '@/types/database';

export interface MonthlyFuelSummary {
  totalLitres: number;
  totalExpenditure: number;
  averagePricePerLitre: number | null;
  fillCount: number;
}

/**
 * Calculates fuel purchase statistics for a given set of entries
 */
export function calculateFuelSummary(entries: FuelEntry[]): MonthlyFuelSummary {
  if (!entries || entries.length === 0) {
    return {
      totalLitres: 0,
      totalExpenditure: 0,
      averagePricePerLitre: null,
      fillCount: 0,
    };
  }

  let totalLitres = 0;
  let totalExpenditure = 0;

  for (const entry of entries) {
    totalLitres += entry.quantity_litres;
    totalExpenditure += entry.total_amount;
  }

  const averagePricePerLitre =
    totalLitres > 0 ? Number((totalExpenditure / totalLitres).toFixed(2)) : null;

  return {
    totalLitres: Number(totalLitres.toFixed(2)),
    totalExpenditure: Number(totalExpenditure.toFixed(2)),
    averagePricePerLitre,
    fillCount: entries.length,
  };
}

/**
 * Validates fuel entry arithmetic and flags differences
 */
export function validateFuelEntryMath(
  pricePerLitre: number,
  quantityLitres: number,
  enteredTotalAmount: number
): { calculatedAmount: number; difference: number; hasDiscrepancy: boolean } {
  const calculatedAmount = Number((pricePerLitre * quantityLitres).toFixed(2));
  const difference = Number(Math.abs(enteredTotalAmount - calculatedAmount).toFixed(2));
  // Rounding difference up to ₹1 is normal at fuel pumps
  const hasDiscrepancy = difference > 1.0;

  return {
    calculatedAmount,
    difference,
    hasDiscrepancy,
  };
}

