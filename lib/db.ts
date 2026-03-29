import { PrismaClient } from '@prisma/client'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

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
// File-Based Storage (Legacy)
// ============================================

const PRODUCTS_PATH = join(process.cwd(), 'data', 'products.json')
const INQUIRIES_PATH = join(process.cwd(), 'data', 'inquiries.json')

function ensureDataFiles() {
  if (!existsSync(PRODUCTS_PATH)) {
    writeFileSync(PRODUCTS_PATH, JSON.stringify([], null, 2))
  }
  if (!existsSync(INQUIRIES_PATH)) {
    writeFileSync(INQUIRIES_PATH, JSON.stringify([], null, 2))
  }
}

ensureDataFiles()

// Export for admin route fallback
export function readProductsFile() {
  try {
    return JSON.parse(readFileSync(PRODUCTS_PATH, 'utf-8')) as any[]
  } catch {
    return []
  }
}

function writeProductsFile(products: any[]) {
  writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2))
}

function readInquiriesFile() {
  try {
    return JSON.parse(readFileSync(INQUIRIES_PATH, 'utf-8')) as any[]
  } catch {
    return []
  }
}

function writeInquiriesFile(inquiries: any[]) {
  writeFileSync(INQUIRIES_PATH, JSON.stringify(inquiries, null, 2))
}

// ============================================
// Unified API - Products
// ============================================

export async function getProducts() {
  // Try database first
  try {
    const dbProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    })
    if (dbProducts.length > 0) return dbProducts
  } catch (error) {
    console.warn('⚠️  Database not ready, falling back to file:', error)
  }

  // Fallback to file
  return readProductsFile().filter((p) => p.is_active === 1 || p.is_active === true)
}

export async function getProductBySlug(slug: string) {
  try {
    const dbProduct = await prisma.product.findFirst({
      where: { slug, isActive: true },
    })
    if (dbProduct) return dbProduct
  } catch (error) {
    console.warn('⚠️  Database error, falling back to file:', error)
  }

  // Fallback
  const products = readProductsFile()
  return products.find((p) => p.slug === slug && (p.is_active === 1 || p.is_active === true))
}

export async function createProduct(data: any) {
  // 1. Write to database
  try {
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
    await prisma.category.updateCategoryStats(data.category)

    return dbProduct
  } catch (error) {
    console.warn('⚠️  Database write failed, using file only:', error)
  }

  // 2. Fallback: Write to file
  const products = readProductsFile()
  const newProduct = {
    ...data,
    id: data.id || `prod_${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  products.push(newProduct)
  writeProductsFile(products)

  return newProduct
}

export async function updateProduct(id: string, data: any) {
  try {
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
      await prisma.category.updateCategoryStats(data.category)
    }

    return dbProduct
  } catch (error) {
    console.warn('⚠️  Database update failed, using file only:', error)
  }

  // Fallback
  const products = readProductsFile()
  const index = products.findIndex((p) => p.id === id)
  if (index === -1) throw new Error('Product not found')

  products[index] = {
    ...products[index],
    ...data,
    updated_at: new Date().toISOString(),
  }
  writeProductsFile(products)
  return products[index]
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })
  } catch (error) {
    console.warn('⚠️  Database delete failed, using file only:', error)
  }

  // Fallback
  const products = readProductsFile()
  const index = products.findIndex((p) => p.id === id)
  if (index !== -1) {
    products[index].is_active = 0
    products[index].updated_at = new Date().toISOString()
    writeProductsFile(products)
  }
}

// ============================================
// Unified API - Hot Products
// ============================================

export async function getHotProducts(limit: number = 10) {
  try {
    // Database query with custom calculation
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
  } catch (error) {
    console.warn('⚠️  Database hot products failed, using file:', error)
  }

  // Fallback
  const products = readProductsFile().filter((p) => p.is_active === 1)
  return products
    .map((p) => ({
      ...p,
      score: (p.salesCount || 0) * 0.6 + (p.viewCount || 0) * 0.4,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

// ============================================
// Unified API - Stats
// ============================================

export async function getStats() {
  try {
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
  } catch (error) {
    console.warn('⚠️  Database stats failed, using file:', error)
    const products = readProductsFile().filter((p) => p.is_active === 1)
    const totalViews = products.reduce((sum, p) => sum + (p.viewCount || 0), 0)
    const totalSales = products.reduce((sum, p) => sum + (p.salesCount || 0), 0)

    return {
      totalProducts: products.length,
      activeProducts: products.length,
      totalViews,
      totalSales,
      avgViewsPerProduct: products.length > 0 ? totalViews / products.length : 0,
      avgSalesPerProduct: products.length > 0 ? totalSales / products.length : 0,
    }
  }
}

// ============================================
// Unified API - Categories
// ============================================

export async function getCategories() {
  try {
    const dbCategories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    })
    if (dbCategories.length > 0) return dbCategories
  } catch (error) {
    console.warn('⚠️  Database categories failed, using fallback:', error)
  }

  // Fallback: derive from products
  const products = readProductsFile().filter((p) => p.is_active === 1)
  const categoryMap = new Map<string, any>()

  products.forEach((p) => {
    const cat = categoryMap.get(p.category) || {
      name: p.category,
      product_count: 0,
      totalViews: 0,
      totalSales: 0,
    }
    cat.product_count++
    cat.totalViews += p.viewCount || 0
    cat.totalSales += p.salesCount || 0
    categoryMap.set(p.category, cat)
  })

  return Array.from(categoryMap.values()).sort((a, b) => b.product_count - a.product_count)
}

// ============================================
// Unified API - View Tracking
// ============================================

export async function trackView(productId: string) {
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (product) {
      await prisma.product.update({
        where: { id: productId },
        data: { viewCount: { increment: 1 } },
      })
      return { success: true, viewCount: product.viewCount + 1 }
    }
  } catch (error) {
    console.warn('⚠️  Database view tracking failed, using file:', error)
  }

  // Fallback
  const products = readProductsFile()
  const index = products.findIndex((p) => p.id === productId)
  if (index !== -1) {
    products[index].viewCount = (products[index].viewCount || 0) + 1
    writeProductsFile(products)
    return { success: true, viewCount: products[index].viewCount }
  }

  return { success: false, viewCount: 0 }
}

// ============================================
// Unified API - Sale Tracking
// ============================================

export async function trackSale(productId: string, quantity: number, orderId?: string, customerInfo?: any) {
  try {
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
  } catch (error) {
    console.warn('⚠️  Database sale tracking failed, using file:', error)
  }

  // Fallback: Update file only (no sale log)
  const products = readProductsFile()
  const index = products.findIndex((p) => p.id === productId)
  if (index !== -1) {
    products[index].salesCount = (products[index].salesCount || 0) + quantity
    writeProductsFile(products)
    return {
      success: true,
      salesCount: products[index].salesCount,
      logEntry: null,
    }
  }

  return { success: false, salesCount: 0 }
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

// ============================================
// Admin Helper (All Products)
// ============================================

export async function dbGetAllProducts() {
  try {
    const dbProducts = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    if (dbProducts.length > 0) return dbProducts
  } catch (error) {
    console.warn('⚠️  Database getAll failed, using file:', error)
  }

  // Fallback (include inactive)
  return readProductsFile()
}
