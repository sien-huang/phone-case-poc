import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const logs = await prisma.saleLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({
      total: logs.length,
      logs
    })
  } catch (error) {
    console.error('Failed to read sales logs:', error)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productId, quantity = 1, orderId, customerInfo } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // 查找产品 (by id or slug)
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { slug: productId }
        ]
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 在一个事务中更新销量并创建日志
    const result = await prisma.$transaction(async (tx) => {
      // 更新销量
      const updatedProduct = await tx.product.update({
        where: { id: product.id },
        data: { salesCount: { increment: quantity } }
      })

      // 创建销售日志
      const log = await tx.saleLog.create({
        data: {
          productId: product.id,
          productName: product.name,
          quantity,
          orderId,
          customerInfo
        }
      })

      return { updatedProduct, log }
    })

    return NextResponse.json({
      success: true,
      salesCount: result.updatedProduct.salesCount,
      logEntry: result.log
    })
  } catch (error) {
    console.error('Track sale error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
