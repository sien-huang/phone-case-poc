import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { updateCategoryStats } from '@/lib/db'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
    })
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

    // Find existing category
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
      // Recompute stats for affected categories
      await updateCategoryStats(name.trim())
      await updateCategoryStats(existing.name)
    }

    return NextResponse.json(category)
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

    // Find category
    const existing = await prisma.category.findFirst({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Unassign products to 'Uncategorized'
    await prisma.product.updateMany({
      where: { category: existing.name },
      data: { category: 'Uncategorized' },
    })

    // Delete category
    await prisma.category.delete({ where: { id } })

    // Update stats for 'Uncategorized'
    await updateCategoryStats('Uncategorized')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
