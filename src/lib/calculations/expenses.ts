import { Expense, FuelEntry, ServiceRecord } from '@/types/database';

export interface CategoryExpense {
  category: string;
  amount: number;
  count: number;
  color: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Petrol: '#E99A35',
  'Engine oil': '#3478D4',
  'General servicing': '#176B45',
  Brakes: '#D9534F',
  Tyres: '#8E44AD',
  'Air filter': '#16A085',
  Battery: '#F39C12',
  Electrical: '#2980B9',
  'Other repairs': '#7F8C8D',
  Miscellaneous: '#95A5A6',
};

/**
 * Combines fuel entries, service records, and standalone expenses into unified category breakdown
 * without double-counting.
 */
export function aggregateAllExpenses(
  fuelEntries: FuelEntry[],
  serviceRecords: ServiceRecord[],
  standaloneExpenses: Expense[]
): {
  totalExpense: number;
  categories: CategoryExpense[];
} {
  const map: Record<string, { amount: number; count: number }> = {};

  // 1. Fuel entries
  let fuelTotal = 0;
  for (const f of fuelEntries) {
    fuelTotal += f.total_amount;
  }
  if (fuelEntries.length > 0) {
    map['Petrol'] = { amount: fuelTotal, count: fuelEntries.length };
  }

  // 2. Service records
  for (const s of serviceRecords) {
    const cat = s.category || 'General servicing';
    if (!map[cat]) {
      map[cat] = { amount: 0, count: 0 };
    }
    map[cat].amount += s.amount;
    map[cat].count += 1;
  }

  // 3. Standalone expenses (e.g., parking, tolls, puncture repair, accessories)
  for (const e of standaloneExpenses) {
    const cat = e.category || 'Miscellaneous';
    if (!map[cat]) {
      map[cat] = { amount: 0, count: 0 };
    }
    map[cat].amount += e.amount;
    map[cat].count += 1;
  }

  const categories: CategoryExpense[] = Object.entries(map).map(([category, data]) => ({
    category,
    amount: Number(data.amount.toFixed(2)),
    count: data.count,
    color: CATEGORY_COLORS[category] || '#738078',
  }));

  // Sort descending by amount
  categories.sort((a, b) => b.amount - a.amount);

  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);

  return {
    totalExpense: Number(totalExpense.toFixed(2)),
    categories,
  };
}
