import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/db'

export async function GET() {
  try {
    // getProducts already filters isActive: true
    const products = await getProducts()
    return NextResponse.json(products)
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
