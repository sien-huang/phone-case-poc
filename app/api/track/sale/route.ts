import { NextResponse } from 'next/server'
import { trackSale } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { productId, quantity = 1, orderId, customerInfo } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const result = await trackSale(productId, quantity, orderId, customerInfo)

    if (!result.success) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Track sale error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
