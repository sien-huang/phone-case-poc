import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// @ts-ignore - Next.js 15 dynamic route params typing
export async function GET(request: NextRequest, { params }: any) {
  try {
    const inquiryId = params.id || ''
    
    const inquiriesPath = join(process.cwd(), 'data', 'inquiries.json')
    const inquiries = JSON.parse(readFileSync(inquiriesPath, 'utf-8'))
    const inquiry = inquiries.find((i: any) => i.id === inquiryId)

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