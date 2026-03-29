'use client'

import { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if user already accepted
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="font-semibold mb-1">We use cookies</p>
          <p className="text-sm text-gray-300">
            We use cookies to improve your experience and analyze traffic. By clicking "Accept", you consent to our use of cookies.
            <a href="/privacy-policy" className="underline ml-1">Learn more</a>
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={accept}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Accept
          </button>
          <button 
            onClick={decline}
            className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}
