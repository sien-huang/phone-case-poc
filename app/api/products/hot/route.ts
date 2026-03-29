import { NextResponse } from 'next/server'
import { getHotProducts } from '@/lib/db'

export async function GET() {
  try {
    const hotProducts = await getHotProducts(10)
    return NextResponse.json(hotProducts)
  } catch (error) {
    console.error('Failed to fetch hot products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hot products' },
      { status: 500 }
    )
  }
}
