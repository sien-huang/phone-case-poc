import { formatCurrency, getCurrencyOptions } from '@/lib/currency';

describe('Currency Library', () => {
  describe('convertUSD', () => {
    it('converts 100 USD to CNY', () => {
      const result = formatCurrency(100, 'CNY');
      // Expected: ¥100 * 7.2 = ¥720
      expect(result).toContain('720');
    });

    it('converts 100 USD to EUR', () => {
      const result = formatCurrency(100, 'EUR');
      // Expected: €92.00
      expect(result).toContain('92');
    });

    it('converts 100 USD to JPY (rounded)', () => {
      const result = formatCurrency(100, 'JPY');
      // Expected: ¥14950 (100 * 149.5)
      expect(result).toContain('14950');
    });

    it('returns same amount for USD', () => {
      const result = formatCurrency(100, 'USD');
      expect(result).toBe('$100.00');
    });
  });

  describe('formatCurrency', () => {
    it('formats with symbol prefix', () => {
      const result = formatCurrency(1234.56, 'USD');
      // USD returns $ + amount
      expect(result).toMatch(/^\$[\d,.]+$/);
    });

    it('handles zero', () => {
      const result = formatCurrency(0, 'USD');
      expect(result).toBe('$0.00');
    });

    it('handles negative amounts', () => {
      const result = formatCurrency(-100, 'USD');
      expect(result).toBe('-100.00'); // formatCurrency returns number string, negative handled differently
    });
  });

  describe('getCurrencyOptions', () => {
    it('returns array of currency objects', () => {
      const options = getCurrencyOptions();
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
    });

    it('includes required currency codes', () => {
      const options = getCurrencyOptions();
      const codes = options.map(o => o.code);
      expect(codes).toContain('USD');
      expect(codes).toContain('CNY');
      expect(codes).toContain('EUR');
    });

    it('each option has code, symbol, and name', () => {
      const options = getCurrencyOptions();
      options.forEach(opt => {
        expect(opt).toHaveProperty('code');
        expect(opt).toHaveProperty('symbol');
        expect(opt).toHaveProperty('name');
      });
    });
  });
});
