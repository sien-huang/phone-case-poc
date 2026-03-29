import { NextResponse } from 'next/server'
import { getProducts, createProduct as dbCreateProduct, updateProduct as dbUpdateProduct, deleteProduct as dbDeleteProduct } from '@/lib/db'

export async function GET() {
  try {
    // Return all products including inactive ones for admin
    const products = await dbGetAllProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Failed to read products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.category || !body.moq || !body.priceRange) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, moq, priceRange' },
        { status: 400 }
      )
    }

    const newProduct = await dbCreateProduct({
      ...body,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description || '',
      compatibility: body.compatibility || [],
      features: body.features || [],
      images: body.images || [],
      status: body.status || 'active',
      viewCount: body.viewCount || 0,
      salesCount: body.salesCount || 0,
      is_active: body.is_active !== 0,
    })

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const updatedProduct = await dbUpdateProduct(id, updates)

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error('Failed to update product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

async function dbGetAllProducts() {
  try {
    // Try database first
    const dbProducts = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    if (dbProducts.length > 0) return dbProducts
  } catch (error) {
    console.warn('⚠️  Database not ready for admin, falling back to file:', error)
  }

  // Fallback to file (include inactive)
  const products = readProductsFile()
  return products
}

import { readProductsFile } from '@/lib/db'
import { prisma } from '@/lib/db'
