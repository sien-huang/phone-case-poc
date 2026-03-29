'use client'

import Link from 'next/link'

export default function WhatsAppButton() {
  const phoneNumber = 'bp-qa' // Your WhatsApp business number with country code
  const message = 'Hello CloudWing, I am interested in...'

  return (
    <a 
      href={`https://wa.me/8613800000000?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-green-500 rounded-full shadow-lg hover:bg-green-600 text-white text-xl"
    >
      💬
    </a>
  )
}
