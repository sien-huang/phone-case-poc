import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// @ts-ignore - Next.js 15 dynamic route params typing
export async function GET(request: Request, { params }: any) {
  try {
    const inquiryId = params.id || ''

    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        items: true,
        communications: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Failed to fetch inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: 500 }
    )
  }
}
