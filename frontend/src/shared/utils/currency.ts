/**
 * Kirmya Number & Currency Formatting Utilities (Prompt 12/50)
 * 
 * Provides consistent formatting for compensation, counts, and metrics.
 */

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'AED',
  options?: Intl.NumberFormatOptions
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string = 'AED',
  period: string = 'month'
): string {
  if (!min && !max) return 'Competitive';
  if (min && !max) return `${formatCurrency(min, currency)}+ / ${period}`;
  if (!min && max) return `Up to ${formatCurrency(max, currency)} / ${period}`;
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)} / ${period}`;
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num);
}
