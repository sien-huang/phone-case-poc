import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// @ts-ignore
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    // 映射前端状态到数据库枚举
    const statusMap: Record<string, 'PENDING' | 'PROCESSING' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED'> = {
      pending: 'PENDING',
      contacted: 'PROCESSING',
      quoted: 'QUOTED',
      closed: 'CONFIRMED'
    }

    const dbStatus = statusMap[status]
    if (!dbStatus) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${Object.keys(statusMap).join(', ')}` },
        { status: 400 }
      )
    }

    // 更新状态
    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        status: dbStatus,
        updatedAt: new Date(),
        // 如果状态改为已处理/已成交，记录 respondedAt
        ...(dbStatus === 'CONFIRMED' || dbStatus === 'QUOTED' ? { respondedAt: new Date() } : {})
      },
      include: {
        items: true,
        communications: true
      }
    })

    return NextResponse.json({ success: true, inquiry })
  } catch (error) {
    console.error('Failed to update inquiry status:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}
