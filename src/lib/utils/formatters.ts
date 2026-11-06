import { format, parseISO } from 'date-fns';

/**
 * Format currency in Indian Rupee (INR) style: ₹1,234.50
 */
export function formatCurrency(amount: number | null | undefined, showDecimals: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);

  return formatted;
}

/**
 * Format distance in km: 12.4 km
 */
export function formatDistance(distanceKm: number | null | undefined, decimals: number = 1): string {
  if (distanceKm === null || distanceKm === undefined || isNaN(distanceKm)) {
    return '0.0 km';
  }
  return `${distanceKm.toFixed(decimals)} km`;
}

/**
 * Format mileage: 42.5 km/l
 */
export function formatMileage(kmpl: number | null | undefined, decimals: number = 1): string {
  if (kmpl === null || kmpl === undefined || isNaN(kmpl) || kmpl <= 0) {
    return '-- km/l';
  }
  return `${kmpl.toFixed(decimals)} km/l`;
}

/**
 * Format fuel quantity: 4.52 L
 */
export function formatLitres(litres: number | null | undefined, decimals: number = 2): string {
  if (litres === null || litres === undefined || isNaN(litres)) {
    return '0.00 L';
  }
  return `${litres.toFixed(decimals)} L`;
}

/**
 * Format date nicely
 */
export function formatDate(dateInput: string | Date | null | undefined, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    return format(d, formatStr);
  } catch {
    return '-';
  }
}

/**
 * Format date & time nicely: 06 Nov, 04:30 PM
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  return formatDate(dateInput, 'dd MMM, hh:mm a');
}

/**
 * Format duration in minutes / hours
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}
