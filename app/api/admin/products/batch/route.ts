import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { action, productIds } = await request.json()

    if (!action || !productIds?.length) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    let updates: any = {}
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

    return NextResponse.json({ success: true, updated: result.count })
  } catch (error) {
    console.error('Batch action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
