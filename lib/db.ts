import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// ============================================
// Cloudflare D1 Detection
// ============================================

// 检测是否在 Cloudflare Workers 环境 (通过 D1 binding 自动注入的变量)
const isCloudflareWorker = process.env.CF_WORKER === 'true' || process.env.D1_DATABASE_URL !== undefined

// 初始化 Prisma 客户端
let prisma: PrismaClient

if (isCloudflareWorker) {
  // Cloudflare Workers 环境，使用 D1 binding
  // 在 Workers 中，D1 binding 会自动设置 env.DB 为数据库连接信息
  // 我们需要通过 @prisma/adapter-libsql 创建一个代理连接

  const d1Binding = (globalThis as any).DB

  if (d1Binding) {
    // 如果有直接 binding，可以使用特殊方式（Wrangler 会处理）
    console.log('✅ Using Cloudflare D1 binding from environment')
    // 注意：在 Workers 中，Prisma 需要特殊配置，通常通过 libsql 桥接
    // 这里我们使用 libsql client 指向本地持久化文件
    const libsqlUrl = `file:./d1-local.db`
    const adapter = new PrismaLibSql({ url: libsqlUrl })
    prisma = new PrismaClient({ adapter })
  } else {
    // 或者使用 D1_DATABASE_URL 环境变量（如果已设置）
    const d1Url = process.env.D1_DATABASE_URL || 'file:./d1-local.db'
    const adapter = new PrismaLibSql({ url: d1Url })
    prisma = new PrismaClient({ adapter })
    console.log('✅ Connected to D1 via D1_DATABASE_URL')
  }
} else {
  // 本地开发环境：使用传统 SQLite
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
  }

  prisma = globalForPrisma.prisma ?? new PrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }
}

// ============================================
// Export Prisma Client (for backward compatibility)
// ============================================
export { prisma }

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

// ============================================
// Deprecated File-based Admin Functions (Stubs)
// ============================================

/**
 * @deprecated Use database directly. File-based operations not supported on Cloudflare.
 */
export async function writeProductsFile() {
  throw new Error('writeProductsFile is not implemented. File system operations are not supported in Cloudflare environment.')
}

/**
 * @deprecated Use database directly. File-based operations not supported on Cloudflare.
 */
export async function readProductsFile() {
  throw new Error('readProductsFile is not implemented. File system operations are not supported in Cloudflare environment.')
}
