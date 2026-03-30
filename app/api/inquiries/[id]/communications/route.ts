import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// @ts-ignore
export async function GET(request: Request, { params }: any) {
  try {
    const inquiryId = params.id

    const communications = await prisma.inquiryCommunication.findMany({
      where: { inquiryId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      total: communications.length,
      communications
    })
  } catch (error) {
    console.error('Failed to fetch communications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    )
  }
}

// @ts-ignore
export async function POST(request: Request, { params }: any) {
  try {
    const inquiryId = params.id
    const body = await request.json()
    const { type, content, created_by } = body

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, content' },
        { status: 400 }
      )
    }

    // 验证询盘存在
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // 映射 type 到枚举
    const commType = type.toUpperCase() === 'EMAIL' ? 'EMAIL' :
                     type.toUpperCase() === 'CALL' ? 'CALL' :
                     type.toUpperCase() === 'WHATSAPP' ? 'WHATSAPP' :
                     type.toUpperCase() === 'NOTE' ? 'NOTE' : 'OTHER'

    const communication = await prisma.inquiryCommunication.create({
      data: {
        inquiryId,
        type: commType,
        direction: 'OUTBOUND', // 默认为外发，管理员添加的
        content,
        createdBy: created_by || 'admin'
      }
    })

    // 更新询盘的 updatedAt
    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json(
      { success: true, communication },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to add communication:', error)
    return NextResponse.json(
      { error: 'Failed to add communication' },
      { status: 500 }
    )
  }
}
