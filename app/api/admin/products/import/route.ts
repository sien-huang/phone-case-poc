import { NextResponse } from 'next/server'
import { getProducts, createProduct as dbCreateProduct, prisma } from '@/lib/db'
import { writeProductsFile, readProductsFile } from '@/lib/db'

export async function GET() {
  try {
    const products = await getProducts()
    // Return all including inactive for export
    const allProducts = readProductsFile()

    return NextResponse.json({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      total: allProducts.length,
      products: allProducts,
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

    // Try database-first approach
    try {
      if (replace) {
        // Delete all existing in DB (careful!)
        await prisma.product.deleteMany({ where: {} })
        for (const p of newProducts) {
          await dbCreateProduct({
            ...p,
            slug: p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
            description: p.description || '',
            compatibility: p.compatibility || [],
            features: p.features || [],
            images: p.images || [],
            status: p.status || 'active',
            viewCount: p.viewCount || 0,
            salesCount: p.salesCount || 0,
            is_active: p.is_active !== 0,
          })
        }
      } else {
        // Merge: upsert based on id or slug
        for (const p of newProducts) {
          const existing = await prisma.product.findFirst({
            where: { OR: [{ id: p.id }, { slug: p.slug }] },
          })
          if (!existing) {
            await dbCreateProduct({
              ...p,
              slug: p.slug || p.name.toLowerCase().replace(/\s+/g, '-'),
              description: p.description || '',
              compatibility: p.compatibility || [],
              features: p.features || [],
              images: p.images || [],
              status: p.status || 'active',
              viewCount: p.viewCount || 0,
              salesCount: p.salesCount || 0,
              is_active: p.is_active !== 0,
            })
          }
        }
      }

      // Also update file for consistency: fetch all from DB and convert to file format
      const dbProducts = await prisma.product.findMany()
      const mergedProducts = dbProducts.map(p => ({
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
        is_active: p.isActive,
        created_at: p.createdAt.toISOString(),
        updated_at: p.updatedAt.toISOString(),
      }))
      writeProductsFile(mergedProducts)

      return NextResponse.json({
        success: true,
        total: (await getProducts()).length,
        added: newProducts.length,
      })
    } catch (dbError) {
      console.warn('⚠️  Database import failed, using file only:', dbError)
      // Fallback to file-only import
      const products = readProductsFile()

      if (replace) {
        products.length = 0
        products.push(
          ...newProducts.map(p => ({
            ...p,
            id: p.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            created_at: p.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        )
      } else {
        const existingIds = new Set(products.map(p => p.id))
        const existingSlugs = new Set(products.map(p => p.slug))
        newProducts.forEach(p => {
          if (!existingIds.has(p.id) && !existingSlugs.has(p.slug)) {
            products.push({
              ...p,
              id: p.id || `prod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              created_at: p.created_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          }
        })
      }

      writeProductsFile(products)

      return NextResponse.json({
        success: true,
        total: products.length,
        added: newProducts.length,
      })
    }
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
