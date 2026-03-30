import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { sendInquiryNotification } from '@/lib/email'

type InquiryStatus = 'PENDING' | 'PROCESSING' | 'QUOTED' | 'CONFIRMED' | 'CANCELLED'

function mapInquiryStatus(s: string | null): InquiryStatus | undefined {
  if (!s) return undefined
  const map: Record<string, InquiryStatus> = {
    pending: 'PENDING',
    processing: 'PROCESSING',
    quoted: 'QUOTED',
    confirmed: 'CONFIRMED',
    cancelled: 'CANCELLED',
    // Legacy compatibility
    contacted: 'PROCESSING',
    closed: 'CONFIRMED'
  }
  return map[s.toLowerCase()]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const dbStatus = mapInquiryStatus(status)
    if (status && !dbStatus) {
      return NextResponse.json(
        { error: `Invalid status. Use: pending, processing, quoted, confirmed, cancelled` },
        { status: 400 }
      )
    }

    const where: any = dbStatus ? { status: dbStatus } : undefined

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: {
        items: true,
        communications: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return NextResponse.json({
      total: inquiries.length,
      inquiries
    })
  } catch (error) {
    console.error('Failed to fetch inquiries:', error)
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 验证必填字段
    const { customer, items } = body
    if (!customer?.email || !items?.length) {
      return NextResponse.json(
        { error: 'Email and at least one product are required' },
        { status: 400 }
      )
    }

    // 计算汇总信息
    const totalQuantity = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)

    // 计算预计总价（优先使用前端传来的 unitPrice）
    let estimatedTotal = 0
    const itemsWithProductData = await Promise.all(
      items.map(async (item: any) => {
        let unitPrice = item.unitPrice

        if (!unitPrice && item.productId) {
          // 从数据库获取产品价格
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: { priceRange: true }
          })

          if (product?.priceRange) {
            const priceMatch = product.priceRange.match(/\$?([\d.]+)/)
            if (priceMatch) {
              unitPrice = parseFloat(priceMatch[1])
            }
          }
        }

        const price = unitPrice || 0
        estimatedTotal += price * (item.quantity || 1)

        return {
          productId: item.productId,
          productName: item.productName || item.productId,
          quantity: item.quantity || 1,
          notes: item.notes || '',
          unitPrice: unitPrice
        }
      })
    )

    // 生成询盘编号 (使用 cuid 保证唯一性)
    const inquiryNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`.toUpperCase()

    // 创建询盘（事务）
    const result = await prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.create({
        data: {
          inquiryNumber,
          status: 'PENDING',
          customerName: customer.name || '',
          customerEmail: customer.email,
          customerPhone: customer.phone || '',
          customerCompany: customer.company || '',
          customerCountry: customer.country || '',
          customerWebsite: customer.website || '',
          totalQuantity,
          estimatedTotal,
          notes: body.notes || '',
          assignedTo: body.user_id || null,
          items: {
            create: itemsWithProductData
          },
          communications: {
            create: {
              type: 'NOTE',
              direction: 'INBOUND',
              content: 'Inquiry created via website',
              createdBy: 'system'
            }
          }
        },
        include: {
          items: true,
          communications: true
        }
      })

      return inquiry
    })

    // 发送邮件通知（异步，不阻塞响应）
    try {
      await sendInquiryNotification(result)
    } catch (emailError) {
      console.log('⚠️  Email not sent:', emailError instanceof Error ? emailError.message : String(emailError))
    }

    return NextResponse.json(
      { success: true, inquiry: result },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create inquiry:', error)
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}