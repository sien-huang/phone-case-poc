import { NextResponse } from 'next/server'
import { dbGetAllProducts, writeProductsFile, prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { action, productIds } = await request.json()

    if (!action || !productIds?.length) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    let updatedCount = 0

    // Try database first
    try {
      const updates: any = {}
      if (action === 'activate') {
        updates.status = 'ACTIVE'
        updates.isActive = true
      } else if (action === 'archive') {
        updates.status = 'ARCHIVED'
        updates.isActive = true
      } else if (action === 'delete') {
        updates.isActive = false
      } else {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      }

      // Batch update in DB
      const result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: updates,
      })
      updatedCount = result.count

      // Update category stats if needed
      if (action === 'activate' || action === 'archive') {
        // Full stats recalc could be expensive; for now rely on on-demand
      }
    } catch (dbError) {
      console.warn('⚠️  Database batch update failed, using file:', dbError)

      // Fallback to file
      const products = await dbGetAllProducts()
      productIds.forEach((id: string) => {
        const index = products.findIndex((p: any) => p.id === id || p.slug === id)
        if (index !== -1) {
          if (action === 'activate') {
            products[index].status = 'active'
            products[index].is_active = 1
          } else if (action === 'archive') {
            products[index].status = 'archived'
            products[index].is_active = 1
          } else if (action === 'delete') {
            products[index].is_active = 0
          }
          updatedCount++
        }
      })
      writeProductsFile(products)
    }

    return NextResponse.json({ success: true, updated: updatedCount })
  } catch (error) {
    console.error('Batch action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
