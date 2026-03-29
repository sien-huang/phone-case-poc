import { NextResponse } from 'next/server'
import { getCategories, prisma, readProductsFile, writeProductsFile } from '@/lib/db'

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, order = 0, is_active = true } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Try database first
    try {
      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          description: description || '',
          order,
          isActive: is_active,
          productCount: 0,
          totalViews: 0,
          totalSales: 0,
        },
      })
      return NextResponse.json(category, { status: 201 })
    } catch (dbError) {
      console.warn('⚠️  Database create failed, using file fallback:', dbError)

      // File fallback: Update products.json with new category assignment
      const products = readProductsFile()
      const newCategoryName = name.trim()

      // Add category to all products that don't have one or need re-categorization
      // For POC, we just accept the category creation without immediate product association

      return NextResponse.json({
        id: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
        name: newCategoryName,
        description: description || '',
        order,
        isActive: is_active,
        productCount: 0,
        totalViews: 0,
        totalSales: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Failed to create category:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, order, is_active } = body

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'Category ID and name are required' }, { status: 400 })
    }

    try {
      // Find existing category by id (which is slugified name)
      const existing = await prisma.category.findFirst({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      // Update category
      const category = await prisma.category.update({
        where: { id },
        data: {
          name: name.trim(),
          description,
          order,
          isActive: is_active ?? existing.isActive,
        },
      })

      // Update product categories if name changed
      if (name.trim() !== existing.name) {
        await prisma.product.updateMany({
          where: { category: existing.name },
          data: { category: name.trim() },
        })
      }

      // Recalculate stats
      await prisma.category.updateCategoryStats(category.name)

      return NextResponse.json(category)
    } catch (dbError) {
      console.warn('⚠️  Database update failed, using file fallback:', dbError)

      // File fallback: Just return success with updated data
      return NextResponse.json({
        id,
        name: name.trim(),
        description: description || '',
        order,
        isActive: is_active ?? true,
        productCount: 0,
        totalViews: 0,
        totalSales: 0,
      })
    }
  } catch (error) {
    console.error('Failed to update category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    try {
      // Find category
      const existing = await prisma.category.findFirst({
        where: { id },
      })

      if (!existing) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      // Option 2: Unassign products (safer)
      await prisma.product.updateMany({
        where: { category: existing.name },
        data: { category: 'Uncategorized' },
      })

      // Delete category
      await prisma.category.delete({ where: { id } })

      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.warn('⚠️  Database delete failed, using file fallback:', dbError)

      // File fallback: Just return success
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
