import { NextResponse } from 'next/server'
import { prisma, dbGetAllProducts } from '@/lib/db'

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

    const newProduct = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        category: body.category,
        description: body.description || '',
        moq: body.moq,
        priceRange: body.priceRange,
        leadTime: body.leadTime || '',
        material: body.material || '',
        compatibility: body.compatibility || [],
        features: body.features || [],
        images: body.images || [],
        viewCount: body.viewCount || 0,
        salesCount: body.salesCount || 0,
        status: body.status === 'DRAFT' ? 'DRAFT' : body.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
        isActive: body.is_active !== 0,
      },
    })

    // Update category stats
    await updateCategoryStats(body.category)

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

    // Build update data
    const updateData: any = {}
    if (updates.name) updateData.name = updates.name
    if (updates.slug) updateData.slug = updates.slug
    if (updates.category) {
      updateData.category = updates.category
      // Track category change for stats update
      const existing = await prisma.product.findUnique({ where: { id } })
      if (existing && existing.category !== updates.category) {
        // Both old and new category stats need recompute
        await updateCategoryStats(updates.category)
        await updateCategoryStats(existing.category)
      }
    }
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.moq !== undefined) updateData.moq = updates.moq
    if (updates.priceRange) updateData.priceRange = updates.priceRange
    if (updates.leadTime) updateData.leadTime = updates.leadTime
    if (updates.material) updateData.material = updates.material
    if (updates.compatibility) updateData.compatibility = updates.compatibility
    if (updates.features) updateData.features = updates.features
    if (updates.images) updateData.images = updates.images
    if (updates.viewCount !== undefined) updateData.viewCount = updates.viewCount
    if (updates.salesCount !== undefined) updateData.salesCount = updates.salesCount
    if (updates.status) {
      updateData.status = updates.status === 'DRAFT' ? 'DRAFT' : updates.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE'
    }
    if (updates.is_active !== undefined) {
      updateData.isActive = updates.is_active !== 0
    }

    updateData.updatedAt = new Date()

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error('Failed to update product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// Helper: updateCategoryStats needs to be imported from lib/db
// Since we are using dbGetAllProducts from lib/db, we should also have updateCategoryStats there.
// We'll import it separately.
import { updateCategoryStats } from '@/lib/db'
