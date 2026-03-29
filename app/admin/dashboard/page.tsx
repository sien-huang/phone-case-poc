'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface StatsData {
  overview: {
    totalProducts: number
    activeProducts: number
    totalViews: number
    totalSales: number
    avgViewsPerProduct: number
    avgSalesPerProduct: number
  }
  categories: Array<{
    name: string
    count: number
    views: number
    sales: number
  }>
  hotProducts: Array<{
    id: string
    name: string
    category: string
    score: number
    viewCount: number
    salesCount: number
  }>
  recentUpdates: Array<{
    id: string
    name: string
    updated_at: string
  }>
  generatedAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <p className="text-red-600">Failed to load statistics</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border">
            <div className="text-sm text-gray-500 mb-2">Total Products</div>
            <div className="text-4xl font-bold text-gray-900">{stats.overview.totalProducts}</div>
            <div className="text-sm text-green-600 mt-2">
              {stats.overview.activeProducts} active
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <div className="text-sm text-gray-500 mb-2">Total Views</div>
            <div className="text-4xl font-bold text-blue-600">
              {(stats.overview.totalViews ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              avg: {(stats.overview.avgViewsPerProduct ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <div className="text-sm text-gray-500 mb-2">Total Sales</div>
            <div className="text-4xl font-bold text-green-600">
              {(stats.overview.totalSales ?? 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              avg: {(stats.overview.avgSalesPerProduct ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border">
            <div className="text-sm text-gray-500 mb-2">Categories</div>
            <div className="text-4xl font-bold text-purple-600">
              {stats.categories.length}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              active categories
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hot Products */}
          <div className="lg:col-span-2 bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-6">🔥 Hot Products</h2>
            <div className="space-y-4">
              {stats.hotProducts.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-400 w-8">#{idx + 1}</div>
                  <div className="flex-1">
                    <Link 
                      href={`/product/${product.id}`}
                      target="_blank"
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(product.score)}
                    </div>
                    <div className="text-sm text-gray-500">
                      👁️ {(product.viewCount || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      🛒 {(product.salesCount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Stats */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-6">📊 Categories</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {stats.categories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{cat.name}</div>
                    <div className="text-sm text-gray-500">
                      {cat.count} products
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">
                      {(cat.views || 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(cat.sales || 0).toLocaleString()} sales
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="mt-8 bg-white rounded-xl border p-6">
          <h2 className="text-xl font-bold mb-6">🕒 Recent Updates</h2>
          <div className="space-y-3">
            {stats.recentUpdates.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Link 
                    href={`/product/${product.id}`}
                    target="_blank"
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Updated: {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <Link 
                  href={`/admin?edit=${product.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Statistics generated: {stats.generatedAt ? new Date(stats.generatedAt).toLocaleString() : 'N/A'}
        </div>
      </main>
    </div>
  )
}