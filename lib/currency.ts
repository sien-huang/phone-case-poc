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

export function formatCurrency(amount: number, currency: keyof typeof RATES): string {
  const info = CURRENCIES.find(c => c.code === currency);
  const symbol = info?.symbol || currency;

  // Handle negative sign placement (before symbol)
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // JPY: no decimals, others: 2 decimals
  const formattedAmount = currency === 'JPY'
    ? absAmount.toFixed(0)
    : absAmount.toFixed(2);

  return isNegative
    ? `-${symbol}${formattedAmount}`
    : `${symbol}${formattedAmount}`;
}

export function getCurrencyOptions() {
  return CURRENCIES;
}