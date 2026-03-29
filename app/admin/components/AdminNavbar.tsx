'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import '../admin.css'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/inquiries', label: 'Inquiries' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/categories', label: 'Categories' },
]

export default function AdminNavbar() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl text-gray-900">
              CloudWing
            </Link>
            <nav className="hidden md:flex gap-6 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    pathname === item.href || pathname.startsWith(item.href + '/')
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Admin</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}