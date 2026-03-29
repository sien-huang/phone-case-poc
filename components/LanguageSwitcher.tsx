'use client'

import { useLocale } from '../contexts/LocaleContext'

const languages = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'zh-Hans', label: '简', name: '简体中文' },
  { code: 'zh-Hant', label: '繁', name: '繁體中文' },
] as const

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-700 hover:text-gray-900 border rounded"
        aria-label="Select Language"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="font-medium">
          {languages.find(l => l.code === locale)?.label || 'EN'}
        </span>
      </button>

      <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="py-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code as any)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between ${
                locale === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
              }`}
            >
              <span>{lang.name}</span>
              {locale === lang.code && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}