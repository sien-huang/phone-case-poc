'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Currency = 'USD' | 'CNY' | 'EUR' | 'GBP' | 'JPY'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatPrice: (amount: number) => string
  convert: (amount: number, from: Currency, to: Currency) => number
  exchangeRates: Record<Currency, number>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// 简化的汇率（相对于 USD）
const DEFAULT_RATES: Record<Currency, number> = {
  USD: 1,
  CNY: 7.2,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('CNY')
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES)

  // 初始化：从 localStorage 获取货币偏好
  useEffect(() => {
    const storedCurrency = localStorage.getItem('currency') as Currency
    if (storedCurrency && ['USD', 'CNY', 'EUR', 'GBP', 'JPY'].includes(storedCurrency)) {
      setCurrencyState(storedCurrency)
    }

    // TODO: 可以从 API 获取实时汇率
    // fetch('/api/exchange-rates').then(...)
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('currency', newCurrency)
  }

  const formatPrice = (amount: number): string => {
    const symbols: Record<Currency, string> = {
      USD: '$',
      CNY: '¥',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
    }

    const formatted = new Intl.NumberFormat(
      currency === 'CNY' ? 'zh-CN' :
      currency === 'JPY' ? 'ja-JP' :
      currency === 'EUR' ? 'de-DE' :
      currency === 'GBP' ? 'en-GB' : 'en-US',
      {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    ).format(amount)

    return formatted
  }

  const convert = (amount: number, from: Currency, to: Currency): number => {
    const fromRate = rates[from]
    const toRate = rates[to]
    const usdAmount = amount / fromRate
    return usdAmount * toRate
  }

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    formatPrice,
    convert,
    exchangeRates: rates,
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
