'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'en' | 'zh-Hans' | 'zh-Hant'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

// 加载翻译文件
let translations: Record<string, Record<string, string>> = {}

async function loadTranslations(locale: Locale): Promise<Record<string, string>> {
  if (translations[locale]) {
    return translations[locale]
  }

  try {
    // 从 app/contexts/ 到 messages/ 的路径是 ../../messages/
    const module = await import(`../../messages/${locale}.json`)
    const flat = flattenTranslations(module.default)
    translations[locale] = flat
    return flat
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error)
    return {}
  }
}

// 扁平化 key: "nav.home" => "Home"
function flattenTranslations(obj: Record<string, any>, prefix = ''): Record<string, string> {
  let result: Record<string, string> = {}
  for (const key in obj) {
    const value = obj[key]
    const newKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      result = { ...result, ...flattenTranslations(value, newKey) }
    } else {
      result[newKey] = value
    }
  }
  return result
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({})

  // 初始化：从 URL 或 Cookie 获取语言
  useEffect(() => {
    const initLocale = async () => {
      // 1. 检查 URL 参数 ?lang=
      const urlParams = new URLSearchParams(window.location.search)
      const urlLang = urlParams.get('lang') as Locale
      if (urlLang && ['en', 'zh-Hans', 'zh-Hant'].includes(urlLang)) {
        setLocaleState(urlLang)
        document.cookie = `locale=${urlLang};path=/;max-age=31536000`
        return
      }

      // 2. 检查 Cookie
      const cookies = document.cookie.split(';').map(c => c.trim())
      const localeCookie = cookies.find(c => c.startsWith('locale='))
      if (localeCookie) {
        const cookieLocale = localeCookie.split('=')[1] as Locale
        if (['en', 'zh-Hans', 'zh-Hant'].includes(cookieLocale)) {
          setLocaleState(cookieLocale)
          return
        }
      }

      // 3. 浏览器语言检测
      const browserLang = navigator.language || navigator.language || 'en'
      if (browserLang.startsWith('zh')) {
        const isTraditional = browserLang.includes('Hant') || browserLang.includes('TW')
        setLocaleState(isTraditional ? 'zh-Hant' : 'zh-Hans')
      } else {
        setLocaleState('en')
      }
    }

    initLocale()
  }, [])

  // 加载对应语言包并扁平化
  useEffect(() => {
    loadTranslations(locale).then(flat => setTranslationsMap(flat))
  }, [locale])

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale)
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    // Update HTML lang attribute
    document.documentElement.lang = newLocale === 'zh-Hans' ? 'zh-Hans' : newLocale === 'zh-Hant' ? 'zh-Hant' : 'en'
    const trans = await loadTranslations(newLocale)
    setTranslationsMap(trans)
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