'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'en' | 'zh-Hans' | 'zh-Hant'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

// Cache for translations
let translationsCache: Record<string, Record<string, string>> = {}

async function loadTranslations(locale: Locale): Promise<Record<string, string>> {
  if (translationsCache[locale]) {
    return translationsCache[locale]
  }

  try {
    const mod = await import(`../messages/${locale}.json`)
    const flat = flattenTranslations(mod.default)
    translationsCache[locale] = flat
    return flat
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error)
    return {}
  }
}

// Flatten nested object to dot notation
function flattenTranslations(obj: Record<string, any>, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {}
  for (const key in obj) {
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenTranslations(value, newKey))
    } else {
      result[newKey] = value as string
    }
  }
  return result
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({})

  // Initialize locale from URL/Cookie/browser
  useEffect(() => {
    const initLocale = async () => {
      // 1. URL param
      const urlParams = new URLSearchParams(window.location.search)
      const urlLang = urlParams.get('lang') as Locale | null
      if (urlLang && ['en', 'zh-Hans', 'zh-Hant'].includes(urlLang)) {
        setLocaleState(urlLang)
        document.cookie = `locale=${urlLang};path=/;max-age=31536000`
        return
      }

      // 2. Cookie
      const cookies = document.cookie.split(';').map(c => c.trim())
      const localeCookie = cookies.find(c => c.startsWith('locale='))
      if (localeCookie) {
        const cookieLocale = localeCookie.split('=')[1] as Locale | undefined
        if (cookieLocale && ['en', 'zh-Hans', 'zh-Hant'].includes(cookieLocale)) {
          setLocaleState(cookieLocale)
          return
        }
      }

      // 3. Browser language
      const browserLang = (navigator as any).language || navigator.language || 'en'
      if (browserLang.startsWith('zh')) {
        const isTraditional = browserLang.includes('Hant') || browserLang.includes('TW')
        setLocaleState(isTraditional ? 'zh-Hant' : 'zh-Hans')
      } else {
        setLocaleState('en')
      }
    }

    initLocale()
  }, [])

  // Load translations when locale changes
  useEffect(() => {
    loadTranslations(locale).then(setTranslationsMap)
    document.documentElement.lang = locale === 'zh-Hans' ? 'zh-Hans' : locale === 'zh-Hant' ? 'zh-Hant' : 'en'
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
  }

  const t = (key: string): string => {
    return translationsMap[key] || key
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return context
}
