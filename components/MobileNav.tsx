'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function MobileNav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-bold text-lg">
          CloudWing
        </Link>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <Link href="/" className="block py-2 font-medium" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link href="/products" className="block py-2 font-medium" onClick={() => setMenuOpen(false)}>
            Products
          </Link>
          <Link href="/categories" className="block py-2 font-medium" onClick={() => setMenuOpen(false)}>
            Categories
          </Link>
          <Link href="/inquiry" className="block py-2 font-medium" onClick={() => setMenuOpen(false)}>
            Get Quote
          </Link>
          <Link href="/admin" className="block py-2 font-medium text-blue-600" onClick={() => setMenuOpen(false)}>
            Admin
          </Link>
        </div>
      )}
    </nav>
  )
}