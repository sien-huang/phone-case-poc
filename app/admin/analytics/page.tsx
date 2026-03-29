'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { format, subDays } from 'date-fns'

interface StatsData {
  overview: {
    totalProducts: number
    activeProducts: number
    totalViews: number
    totalSales: number
    avgViewsPerProduct: number
    avgSalesPerProduct: number
    conversionRate: string
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
  salesTrend: Array<{
    date: string
    views: number
    sales: number
  }>
  topSellers: Array<{
    id: string
    name: string
    category: string
    salesCount: number
    viewCount: number
    priceRange: string
  }>
  topViewed: Array<{
    id: string
    name: string
    category: string
    viewCount: number
    salesCount: number
  }>
  generatedAt: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function AnalyticsPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Failed to load analytics</p>
      </div>
    )
  }

  // 准备图表数据
  const pieData = stats.categories.slice(0, 10).map(cat => ({
    name: cat.name,
    value: cat.count,
  }))

  const barData = stats.categories.slice(0, 10).map(cat => ({
    name: cat.name,
    Products: cat.count,
    Views: Math.round(cat.views / 100), // 缩放以便显示
    Sales: Math.round(cat.sales / 10),
  }))

  // 过滤趋势数据 based on time range
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
  const trendData = stats.salesTrend.slice(-days).map(d => ({
    ...d,
    date: format(new Date(d.date), 'MM/dd'),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border">
            <div className="text-sm text-gray-500 mb-2">Total Products</div>
            <div className="text-4xl font-bold text-gray-900">{stats.overview.totalProducts ?? 0}</div>
            <div className="text-sm text-green-600 mt-2">
              {stats.overview.activeProducts ?? 0} active
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
            <div className="text-sm text-gray-500 mb-2">Conversion Rate</div>
            <div className="text-4xl font-bold text-purple-600">
              {stats.overview.conversionRate ?? '0%'}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              views → sales
            </div>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">📈 Sales & Views Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="views"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="Views"
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="Sales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Sellers */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-6">🏆 Top Sellers</h2>
            <div className="space-y-4">
              {stats.topSellers.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</div>
                  <div className="flex-1">
                    <Link href={`/product/${product.id}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600">
                      {product.name}
                    </Link>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{(product.salesCount || 0).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">sales</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most Viewed */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-6">👁️ Most Viewed</h2>
            <div className="space-y-4">
              {stats.topViewed.map((product, idx) => (
                <div key={product.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-400 w-6">#{idx + 1}</div>
                  <div className="flex-1">
                    <Link href={`/product/${product.id}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600">
                      {product.name}
                    </Link>
                    <p className="text-sm text-gray-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{(product.viewCount || 0).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-6">📊 Category Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }: any) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-xl font-bold mb-6">📈 Category Performance</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Products" fill="#0088FE" />
                  <Bar dataKey="Views" fill="#00C49F" />
                  <Bar dataKey="Sales" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Hot Products Table */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">🔥 Hot Products Ranking</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">Rank</th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3 text-right">Sales</th>
                </tr>
              </thead>
              <tbody>
                {stats.hotProducts.map((product, idx) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                        idx === 1 ? 'bg-gray-100 text-gray-800' :
                        idx === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/product/${product.id}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">
                      {Math.round(product.score)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(product.viewCount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-green-600">
                        {(product.salesCount || 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Updates */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-xl font-bold mb-6">🕒 Recent Product Updates</h2>
          <div className="space-y-3">
            {stats.recentUpdates.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Link href={`/product/${product.id}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600">
                    {product.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Updated: {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link 
                    href={`/admin/products?edit=${product.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          Analytics generated: {stats.generatedAt ? new Date(stats.generatedAt).toLocaleString() : 'N/A'}
        </div>
      </main>
    </div>
  )
}