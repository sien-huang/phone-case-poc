import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Return all products (including inactive) for export
    const allProducts = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    // Convert to file-compatible format
    const exported = allProducts.map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      description: p.description,
      moq: p.moq,
      priceRange: p.priceRange,
      leadTime: p.leadTime,
      material: p.material,
      compatibility: p.compatibility,
      features: p.features,
      images: p.images,
      viewCount: p.viewCount,
      salesCount: p.salesCount,
      status: p.status,
      is_active: p.isActive ? 1 : 0,
      created_at: p.createdAt.toISOString(),
      updated_at: p.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      total: exported.length,
      products: exported,
    })
  } catch (error) {
    console.error('Export failed:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { products: newProducts, replace = false } = await request.json()

    if (!Array.isArray(newProducts)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    if (replace) {
      // Delete all existing products
      await prisma.product.deleteMany({ where: {} })
    }

    // Upsert products
    let added = 0
    for (const p of newProducts) {
      const existing = await prisma.product.findFirst({
        where: {
          OR: [
            { id: p.id },
            { slug: p.slug }
          ]
        }
      })

      if (!existing) {
        await prisma.product.create({
          data: {
            id: p.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            slug: p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
            name: p.name,
            category: p.category,
            description: p.description || '',
            moq: p.moq || 1,
            priceRange: p.priceRange || '',
            leadTime: p.leadTime || '',
            material: p.material,
            compatibility: p.compatibility || [],
            features: p.features || [],
            images: p.images || [],
            viewCount: p.viewCount || 0,
            salesCount: p.salesCount || 0,
            status: p.status === 'DRAFT' ? 'DRAFT' : p.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
            isActive: p.is_active !== 0,
            createdAt: p.created_at ? new Date(p.created_at) : new Date(),
            updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
          },
        })
        added++
      }
    }

    // If replace was used, refresh category stats (simplified: skip for now)
    // TODO: Recompute category statistics after bulk import

    const totalProducts = await prisma.product.count()

    return NextResponse.json({
      success: true,
      total: totalProducts,
      added,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
