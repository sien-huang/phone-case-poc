import { PrismaClient } from '@prisma/client'

// ============================================
// Prisma Configuration
// ============================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// ============================================
// Unified API - Products
// ============================================

export async function getProducts() {
  const dbProducts = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  })
  return dbProducts
}

export async function getProductBySlug(slug: string) {
  const dbProduct = await prisma.product.findFirst({
    where: { slug, isActive: true },
  })
  return dbProduct
}

export async function createProduct(data: any) {
  const dbProduct = await prisma.product.create({
    data: {
      ...data,
      viewCount: data.viewCount ?? 0,
      salesCount: data.salesCount ?? 0,
      status: mapStatus(data.status),
      isActive: data.is_active !== 0,
      compatibility: data.compatibility || [],
      features: data.features || [],
      images: data.images || [],
    },
  })

  // Update category stats
  await updateCategoryStats(data.category)

  return dbProduct
}

export async function updateProduct(id: string, data: any) {
  const dbProduct = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
      status: data.status ? mapStatus(data.status) : undefined,
    },
  })

  // Update category stats if category changed
  if (data.category) {
    await updateCategoryStats(data.category)
  }

  return dbProduct
}

export async function deleteProduct(id: string) {
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  })
}

// ============================================
// Unified API - Hot Products
// ============================================

export async function getHotProducts(limit: number = 10) {
  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
  })

  // Calculate score: salesCount * 0.6 + viewCount * 0.4
  const scored = allProducts
    .map((p) => ({
      ...p,
      score: (p.salesCount || 0) * 0.6 + (p.viewCount || 0) * 0.4,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored
}

// ============================================
// Unified API - Stats
// ============================================

export async function getStats() {
  const [
    totalProducts,
    activeProducts,
    totalViews,
    totalSales,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.aggregate({ _sum: { viewCount: true } }),
    prisma.product.aggregate({ _sum: { salesCount: true } }),
  ])

  return {
    totalProducts,
    activeProducts,
    totalViews: totalViews._sum.viewCount || 0,
    totalSales: totalSales._sum.salesCount || 0,
    avgViewsPerProduct: totalProducts > 0 ? (totalViews._sum.viewCount || 0) / totalProducts : 0,
    avgSalesPerProduct: totalProducts > 0 ? (totalSales._sum.salesCount || 0) / totalProducts : 0,
  }
}

// ============================================
// Unified API - Categories
// ============================================

export async function getCategories() {
  const dbCategories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
  })
  return dbCategories
}

// ============================================
// Unified API - View Tracking
// ============================================

export async function trackView(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (product) {
    await prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    })
    return { success: true, viewCount: product.viewCount + 1 }
  }

  return { success: false, viewCount: 0 }
}

// ============================================
// Unified API - Sale Tracking
// ============================================

export async function trackSale(productId: string, quantity: number, orderId?: string, customerInfo?: any) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new Error('Product not found')

  // Create sale log
  await prisma.saleLog.create({
    data: {
      productId,
      productName: product.name,
      quantity,
      orderId,
      customerInfo,
    },
  })

  // Update sales count
  await prisma.product.update({
    where: { id: productId },
    data: { salesCount: { increment: quantity } },
  })

  return {
    success: true,
    salesCount: product.salesCount + quantity,
    logEntry: {
      productId,
      productName: product.name,
      quantity,
      orderId,
    },
  }
}

// ============================================
// Helper Functions
// ============================================

function mapStatus(status: string): 'ACTIVE' | 'DRAFT' | 'ARCHIVED' {
  const map: Record<string, 'ACTIVE' | 'DRAFT' | 'ARCHIVED'> = {
    active: 'ACTIVE',
    draft: 'DRAFT',
    archived: 'ARCHIVED',
  }
  return map[status] || 'ACTIVE'
}

// Update category statistics (product count, views, sales)
export async function updateCategoryStats(categoryName: string) {
  // Get all active products in this category
  const products = await prisma.product.findMany({
    where: {
      category: categoryName,
      isActive: true,
    },
  })

  // Calculate aggregates
  const productCount = products.length
  const totalViews = products.reduce((sum, p) => sum + (p.viewCount || 0), 0)
  const totalSales = products.reduce((sum, p) => sum + (p.salesCount || 0), 0)

  // Upsert category stats
  await prisma.category.upsert({
    where: { name: categoryName },
    update: {
      productCount,
      totalViews,
      totalSales,
      updatedAt: new Date(),
    },
    create: {
      name: categoryName,
      productCount,
      totalViews,
      totalSales,
      isActive: true,
      order: 0,
    },
  })
}

// ============================================
// Admin Helper (All Products)
// ============================================

export async function dbGetAllProducts() {
  const dbProducts = await prisma.product.findMany({
    orderBy: { updatedAt: 'desc' },
  })
  return dbProducts
}
