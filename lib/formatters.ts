import { formatCurrency, convertUSD } from './currency';

/**
 * Format a date to string
 */
export function formatDate(date: Date | null | undefined, formatStr?: string): string {
  if (!date) return 'N/A';

  const d = new Date(date);

  if (formatStr) {
    // Simple format implementation (for production use a library like date-fns)
    const formatMap: Record<string, string> = {
      'yyyy': d.getFullYear().toString(),
      'MM': String(d.getMonth() + 1).padStart(2, '0'),
      'dd': String(d.getDate()).padStart(2, '0'),
      'HH': String(d.getHours()).padStart(2, '0'),
      'mm': String(d.getMinutes()).padStart(2, '0'),
      'ss': String(d.getSeconds()).padStart(2, '0'),
    };

    let result = formatStr;
    Object.entries(formatMap).forEach(([token, value]) => {
      result = result.replace(token, value);
    });
    return result;
  }

  return d.toISOString().split('T')[0];
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number | null | undefined, decimals: number = 0): string {
  if (num === null || num === undefined) return 'N/A';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Format status with color coding
 */
export function getStatusColor(status: string): 'green' | 'yellow' | 'red' | 'gray' {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'completed':
    case 'paid':
      return 'green';
    case 'pending':
    case 'processing':
      return 'yellow';
    case 'rejected':
    case 'cancelled':
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}
