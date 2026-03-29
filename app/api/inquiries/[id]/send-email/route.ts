import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { sendInquiryNotification } from '@/lib/email'

// @ts-ignore
export async function POST(request: NextRequest, { params }: any) {
  try {
    const inquiryId = params.id
    
    // 读取询盘数据
    const inquiriesPath = join(process.cwd(), 'data', 'inquiries.json')
    const inquiries = JSON.parse(readFileSync(inquiriesPath, 'utf-8'))
    const inquiry = inquiries.find((i: any) => i.id === inquiryId)
    
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