// 汇率配置（相对于 USD）
// 实际生产应使用实时汇率 API（如 Open Exchange Rates）
const RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CNY: 7.23,
};

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

export function convertUSD(amountUSD: number, to: keyof typeof RATES): number {
  const rate = RATES[to];
  if (!rate) return amountUSD;
  // 日元通常不显示小数
  if (to === 'JPY') {
    return Math.round(amountUSD * rate);
  }
  return Math.round((amountUSD * rate) * 100) / 100;
}

export function formatCurrency(amountUSD: number, currency: keyof typeof RATES): string {
  const converted = convertUSD(amountUSD, currency);
  const info = CURRENCIES.find(c => c.code === currency);
  const symbol = info?.symbol || currency;

  if (currency === 'JPY') {
    return `${symbol}${converted}`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}

export function getCurrencyOptions() {
  return CURRENCIES;
}