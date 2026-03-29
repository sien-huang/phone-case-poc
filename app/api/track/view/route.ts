import { NextResponse } from 'next/server'
import { trackView } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const result = await trackView(productId)

    if (!result.success) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Track view error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
