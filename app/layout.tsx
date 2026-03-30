import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css' // 👈 关键修复：导入 Tailwind 全局样式
import { LocaleProvider } from '@/contexts/LocaleContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import Header from '@/components/Header'
import BackToTop from '@/components/BackToTop'
import ReadingProgressBar from '@/components/ReadingProgressBar'
import Analytics from '@/components/Analytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://cloudwing-cases.com'),
  title: {
    default: 'CloudWing Cases - Premium Phone Case Wholesale',
    template: '%s | CloudWing Cases'
  },
  description: 'CloudWing (云翼智造) - Professional B2B phone case wholesale. High-quality TPU/PC phone cases for iPhone, Samsung, Google Pixel. OEM/ODM services available.',
  keywords: ['phone case', 'wholesale', 'B2B', 'TPU case', 'iPhone case', 'Samsung case', 'OEM', 'ODM', '云翼智造', '手机壳批发'],
  authors: [{ name: 'CloudWing' }],
  creator: 'CloudWing',
  publisher: 'CloudWing',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['zh_CN', 'zh_TW'],
    url: 'https://cloudwing-cases.com',
    title: 'CloudWing Cases - Premium Phone Case Wholesale',
    description: 'Professional B2B phone case wholesale. High-quality TPU/PC phone cases for all major brands.',
    siteName: 'CloudWing Cases',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CloudWing Cases - Premium Phone Case Wholesale',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-gray-900`}>
        <Analytics />
        <ReadingProgressBar />
        <LocaleProvider>
          <AuthProvider>
            <CurrencyProvider>
              <Header />
              <main>{children}</main>
              <BackToTop />
            </CurrencyProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
