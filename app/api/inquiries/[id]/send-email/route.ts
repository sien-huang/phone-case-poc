import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendInquiryNotification } from '@/lib/email'

// @ts-ignore
export async function POST(request: Request, { params }: any) {
  try {
    const inquiryId = params.id

    // 从数据库获取询盘
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        items: true
      }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // 发送邮件
    await sendInquiryNotification(inquiry)

    return NextResponse.json({
      success: true,
      message: 'Email notification sent successfully',
    })
  } catch (error) {
    console.error('Failed to send email:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      },
      { status: 500 }
    )
  }
}
