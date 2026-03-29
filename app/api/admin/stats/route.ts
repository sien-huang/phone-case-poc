import { NextResponse } from 'next/server'
import { getStats, getCategories, getHotProducts, getProducts } from '@/lib/db'

// 模拟销售趋势数据（按天聚合，最近30天）
function generateSalesTrend(products: any[]) {
  const days = 30
  const trend: { date: string; views: number; sales: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    // 模拟数据：每天的总和
    const dayViews = products.reduce((sum, p) => {
      const baseDaily = Math.floor(((p.viewCount || 0) / days))
      const variance = Math.floor(Math.random() * 20) - 10
      return sum + Math.max(0, baseDaily + variance)
    }, 0)

    const daySales = products.reduce((sum, p) => {
      const baseDaily = Math.floor(((p.salesCount || 0) / days))
      const variance = Math.floor(Math.random() * 5) - 2
      return sum + Math.max(0, baseDaily + variance)
    }, 0)

    trend.push({ date: dateStr, views: dayViews, sales: daySales })
  }

  return trend
}

export async function GET() {
  try {
    // Get all stats from db layer
    const [stats, categories, hotProducts, allProducts] = await Promise.all([
      getStats(),
      getCategories(),
      getHotProducts(10),
      getProducts(), // Needs all products for trend & tops
    ])

    // Derive additional data from allProducts
    const topSellers = allProducts
      .filter(p => (p.salesCount || 0) > 0)
      .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        salesCount: p.salesCount || 0,
        viewCount: p.viewCount || 0,
        priceRange: p.priceRange,
      }))

    const topViewed = allProducts
      .filter(p => (p.viewCount || 0) > 0)
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        viewCount: p.viewCount || 0,
        salesCount: p.salesCount || 0,
      }))

    const salesTrend = generateSalesTrend(allProducts)

    // Recent updates (last 5)
    const recentUpdates = [...allProducts]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        updated_at: p.updatedAt || p.createdAt,
      }))

    return NextResponse.json({
      overview: {
        totalProducts: stats.totalProducts,
        activeProducts: stats.activeProducts,
        totalViews: stats.totalViews,
        totalSales: stats.totalSales,
        avgViewsPerProduct: Math.round(stats.avgViewsPerProduct || 0),
        avgSalesPerProduct: Math.round(stats.avgSalesPerProduct || 0),
        conversionRate: stats.totalViews > 0 ? ((stats.totalSales / stats.totalViews) * 100).toFixed(2) + '%' : '0%',
      },
      categories,
      hotProducts,
      recentUpdates,
      salesTrend,
      topSellers,
      topViewed,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to generate statistics' }, { status: 500 })
  }
}
