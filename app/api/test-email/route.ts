import { NextResponse } from 'next/server'
import { sendInquiryNotification } from '@/lib/email'

export async function GET() {
  const config = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER ? '***' : undefined,
    SMTP_PASS: process.env.SMTP_PASS ? '***' : undefined,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  }

  const hasConfig = config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS && config.ADMIN_EMAIL

  return NextResponse.json({
    configured: !!hasConfig,
    config: config,
    message: hasConfig 
      ? 'Email configuration detected. Send a test email?'
      : 'Missing email configuration. Set SMTP_HOST, SMTP_USER, SMTP_PASS, ADMIN_EMAIL in .env.local'
  })
}

export async function POST() {
  try {
    // 创建一个测试询盘数据
    const testInquiry = {
      id: 'test-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'pending',
      customer: {
        name: 'Test Customer',
        company: 'Test Company',
        email: 'test@example.com',
        phone: '+86 123 4567 8900',
        country: 'China',
        website: 'https://example.com',
      },
      items: [
        {
          productId: 'test-product-1',
          productName: 'Test Product A',
          quantity: 500,
          unitPrice: 9.99,
        },
        {
          productId: 'test-product-2',
          productName: 'Test Product B',
          quantity: 1000,
          unitPrice: 7.99,
        },
      ],
      summary: {
        totalQuantity: 1500,
        estimatedTotal: 9999.99,
        leadTime: '3-4 weeks',
        notes: 'This is a test email notification. Please ignore.',
      },
      communications: [],
    }

    await sendInquiryNotification(testInquiry)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}