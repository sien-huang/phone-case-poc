import { NextRequest, NextResponse } from 'next/server'
import { createInquiry, getProducts } from '@/lib/data'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const inquiryId = Date.now().toString()
    
    const inquiry = {
      id: inquiryId,
      companyName: formData.get('companyName') as string,
      businessType: formData.get('businessType') as string,
      targetMarket: formData.get('targetMarket') as string,
      products: JSON.parse(formData.get('products') as string || '[]'),
      quantity: formData.get('quantity') as string,
      timeline: formData.get('timeline') as string,
      message: formData.get('message') as string,
      file_path: null,
      email: formData.get('email') as string || '',
      status: 'new',
      timestamp: new Date().toISOString(),
    }

    // Validate required fields
    if (!inquiry.companyName || !inquiry.businessType || !inquiry.targetMarket || !inquiry.quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to JSON file
    try {
      createInquiry(inquiry)
      console.log('✅ Inquiry saved:', inquiryId)
    } catch (dbError) {
      console.error('❌ Save error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save inquiry' },
        { status: 500 }
      )
    }

    // Send email notification (if configured)
    try {
      const smtpHost = process.env.SMTP_HOST
      const smtpPort = parseInt(process.env.SMTP_PORT || '587')
      const smtpUser = process.env.SMTP_USER
      const smtpPass = process.env.SMTP_PASS
      const adminEmail = process.env.ADMIN_EMAIL || '272536022@qq.com'

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: false,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        })

        const products = getProducts()
        const productList = inquiry.products.length > 0 
          ? inquiry.products.map((id: string) => {
              const product = products.find((p: any) => p.id === id)
              return product ? product.name : id
            }).join(', ')
          : 'No products selected'

        await transporter.sendMail({
          from: smtpUser,
          to: adminEmail,
          subject: `[CloudWing] New Quote Request from ${inquiry.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">New Wholesale Quote Request</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold; color: #666;">Company:</td><td style="padding: 8px;">${inquiry.companyName}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #666;">Business Type:</td><td style="padding: 8px;">${inquiry.businessType}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #666;">Target Market:</td><td style="padding: 8px;">${inquiry.targetMarket}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #666;">Products:</td><td style="padding: 8px;">${productList}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #666;">Quantity:</td><td style="padding: 8px;">${inquiry.quantity}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #666;">Timeline:</td><td style="padding: 8px;">${inquiry.timeline || 'Not specified'}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #666;">Message:</td><td style="padding: 8px;">${inquiry.message || 'None'}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold; color: #666;">Submitted:</td><td style="padding: 8px;">${new Date(inquiry.timestamp).toLocaleString()}</td></tr>
              </table>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This is an automated notification from CloudWing Cases website.
              </p>
            </div>
          `
        })
        console.log('📧 Email sent to', adminEmail)
      }
    } catch (emailError) {
      console.log('⚠️  Email not sent:', emailError instanceof Error ? emailError.message : String(emailError))
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Quote request submitted successfully',
        inquiryId 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error processing quote:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
