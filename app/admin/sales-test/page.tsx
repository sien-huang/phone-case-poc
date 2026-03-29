'use client'

import { useState } from 'react'
import productsData from '@/data/products.json'

export default function SalesTestPage() {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTrackSale = async () => {
    if (!productId) return
    setLoading(true)
    try {
      const res = await fetch('/api/track/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      })
      const data = await res.json()
      setResult(data)
      if (res.ok) {
        alert(`Sale tracked! New total: ${data.salesCount}`)
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      alert('Failed to track sale')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6">Sales Tracking Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Product ID or Slug</label>
            <input
              type="text"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="e.g., iphone15-classic"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Try: {productsData.slice(0, 5).map(p => (
                <code key={p.id} className="block bg-gray-100 px-2 py-1 my-1" onClick={() => setProductId(p.id)}>
                  {p.id} - {p.name}
                </code>
              ))}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min={1}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            onClick={handleTrackSale}
            disabled={loading}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Tracking...' : 'Track Sale'}
          </button>

          {result && (
            <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <h3 className="font-bold mb-2">{result.success ? '✅ Success' : '❌ Error'}</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}