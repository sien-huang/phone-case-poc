'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Header() {
  const { t } = useLocale()
  const { currency, setCurrency } = useCurrency()
  const [menuOpen, setMenuOpen] = useState(false)

  const currencyOptions = [
    { code: 'USD', symbol: '$' },
    { code: 'CNY', symbol: '¥' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'JPY', symbol: '¥' },
  ] as const

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="font-bold text-xl text-gray-900 tracking-tight">
            CloudWing
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700" role="navigation">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="/products" className="hover:text-blue-600 transition-colors">
              {t('nav.products')}
            </Link>
            <Link href="/certifications" className="hover:text-blue-600 transition-colors">
              Certifications
            </Link>
            <Link href="/about" className="hover:text-blue-600 transition-colors">
              About
            </Link>
            <Link href="/inquiry" className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors">
              {t('nav.getQuote')}
            </Link>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="px-2 py-1 border rounded text-xs"
              title="Currency"
            >
              {currencyOptions.map(opt => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} ({opt.symbol})
                </option>
              ))}
            </select>
            <LanguageSwitcher />
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="px-2 py-1 border rounded text-xs"
              title="Currency"
            >
              {currencyOptions.map(opt => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} ({opt.symbol})
                </option>
              ))}
            </select>
            <LanguageSwitcher />
            <button
              className="p-2 hover:bg-gray-100 rounded"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-gray-50" role="navigation">
          <div className="container py-3 space-y-1">
            <div className="px-3 py-2">
              <label className="text-xs text-gray-500 mb-1 block">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-2 py-1 border rounded text-sm"
              >
                {currencyOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} ({opt.symbol})
                  </option>
                ))}
              </select>
            </div>
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/products"
              className="block px-3 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.products')}
            </Link>
            <Link
              href="/certifications"
              className="block px-3 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded"
              onClick={() => setMenuOpen(false)}
            >
              Certifications
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/inquiry"
              className="block px-3 py-2 text-blue-600 font-medium hover:bg-gray-100 rounded"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.getQuote')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}