import { formatCurrency, convertUSD } from '@/lib/currency';
import { formatDate, formatNumber, formatPercent, formatFileSize, formatPhoneNumber, getStatusColor } from '@/lib/formatters';

describe('formatCurrency', () => {
  it('formats USD currency correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1234.56');
  });

  it('formats CNY currency correctly', () => {
    expect(formatCurrency(1234.56, 'CNY')).toBe('¥1234.56');
  });

  it('handles zero values', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('handles large numbers with proper rounding', () => {
    expect(formatCurrency(1234567.89, 'USD')).toBe('$1234567.89');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-123.45, 'USD')).toBe('-$123.45');
  });
});

describe('convertUSD', () => {
  it('converts USD to EUR correctly', () => {
    const result = convertUSD(100, 'EUR');
    expect(result).toBeCloseTo(92, 0);
  });

  it('converts USD to CNY correctly', () => {
    const result = convertUSD(100, 'CNY');
    expect(result).toBeCloseTo(723, 0); // 100 * 7.23 = 723
  });

  it('rounds JPY correctly', () => {
    const result = convertUSD(100, 'JPY');
    expect(result).toBe(Math.round(100 * 149.5));
  });

  it('returns same amount for unknown currency', () => {
    expect(convertUSD(100, 'UNKNOWN' as any)).toBe(100);
  });
});

describe('formatDate', () => {
  it('formats date in default format (YYYY-MM-DD)', () => {
    // formatDate uses toISOString() which returns UTC
    // Create a date that when converted to UTC will be 2024-01-15
    const date = new Date('2024-01-15T00:00:00Z');
    const result = formatDate(date);
    expect(result).toBe('2024-01-15');
  });

  it('formats with custom format tokens', () => {
    const date = new Date(2024, 0, 15, 14, 30); // Jan 15, 2024 14:30
    expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-01-15');
    expect(formatDate(date, 'MM/dd/yyyy')).toBe('01/15/2024');
    expect(formatDate(date, 'HH:mm')).toBe('14:30');
  });

  it('handles invalid dates gracefully', () => {
    expect(formatDate(null as any)).toBe('N/A');
    expect(formatDate(undefined as any)).toBe('N/A');
  });
});

describe('formatNumber', () => {
  it('formats numbers with thousand separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('formats decimals with precision', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1,234.57');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('handles null and undefined', () => {
    expect(formatNumber(null as any)).toBe('N/A');
    expect(formatNumber(undefined as any)).toBe('N/A');
  });
});

describe('formatPercent', () => {
  it('formats percentage correctly', () => {
    expect(formatPercent(0.1234, 1)).toBe('12.3%');
    expect(formatPercent(0.5)).toBe('50.0%');
    expect(formatPercent(1)).toBe('100.0%');
  });
});

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats KB correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
  });

  it('formats MB correctly', () => {
    expect(formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('formats GB correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1.0 GB');
  });
});

describe('formatPhoneNumber', () => {
  it('formats 10-digit phone numbers', () => {
    expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
  });

  it('removes non-numeric characters', () => {
    expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
  });

  it('returns original for non-10-digit', () => {
    expect(formatPhoneNumber('12345')).toBe('12345');
  });
});

describe('getStatusColor', () => {
  it('returns green for approved/completed/paid', () => {
    expect(getStatusColor('approved')).toBe('green');
    expect(getStatusColor('completed')).toBe('green');
    expect(getStatusColor('paid')).toBe('green');
  });

  it('returns yellow for pending/processing', () => {
    expect(getStatusColor('pending')).toBe('yellow');
    expect(getStatusColor('processing')).toBe('yellow');
  });

  it('returns red for rejected/cancelled/failed', () => {
    expect(getStatusColor('rejected')).toBe('red');
    expect(getStatusColor('cancelled')).toBe('red');
    expect(getStatusColor('failed')).toBe('red');
  });

  it('returns gray for unknown status', () => {
    expect(getStatusColor('unknown')).toBe('gray');
  });
});
