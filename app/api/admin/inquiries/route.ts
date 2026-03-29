import { NextRequest, NextResponse } from 'next/server'
import { getInquiries } from '@/lib/data'

export async function GET() {
  try {
    const inquiries = getInquiries()
    return NextResponse.json(inquiries)
  } catch (error) {
    console.error('Failed to read inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' }, 
      { status: 500 }
    )
  }
}
