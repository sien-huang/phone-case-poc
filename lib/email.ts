import nodemailer from 'nodemailer'

// 邮件配置（从 .env.local 读取）
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export async function sendInquiryNotification(inquiry: any) {
  // 1. 验证配置完整性
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !ADMIN_EMAIL) {
    console.error('❌ Email configuration incomplete. Please check .env.local')
    console.error('Current config:', {
      SMTP_HOST: SMTP_HOST || 'MISSING',
      SMTP_PORT: SMTP_PORT || 'MISSING',
      SMTP_USER: SMTP_USER ? '***' : 'MISSING',
      SMTP_PASS: SMTP_PASS ? '***' : 'MISSING',
      ADMIN_EMAIL: ADMIN_EMAIL || 'MISSING',
    })
    return
  }

  console.log('📧 Sending inquiry notification email...')
  console.log('SMTP:', SMTP_HOST, SMTP_PORT, 'FROM:', SMTP_USER, 'TO:', ADMIN_EMAIL)

  // 2. 创建 transporter
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false, // 587 使用 STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    logger: true,
    debug: true,
  })

  // 3. 验证 SMTP 连接（可选但推荐）
  try {
    const verification = await transporter.verify()
    console.log('✅ SMTP connection verified:', verification)
  } catch (verr: any) {
    console.error('❌ SMTP connection verification failed:', verr.message)
    throw verr // 抛出让调用方知道
  }

  // 4. 准备邮件内容 - 适配新数据库结构
  // New schema: flat fields + items relation
  const customerEmail = inquiry.customerEmail || inquiry.customer?.email || 'N/A'
  const customerName = inquiry.customerName || inquiry.customer?.name || 'Unknown'
  const customerCompany = inquiry.customerCompany || inquiry.customer?.company || 'N/A'
  const customerPhone = inquiry.customerPhone || inquiry.customer?.phone || 'N/A'
  const customerCountry = inquiry.customerCountry || inquiry.customer?.country || 'N/A'

  // Build summary object for template compatibility
  const summary = {
    totalQuantity: inquiry.totalQuantity || inquiry.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0,
    estimatedTotal: inquiry.estimatedTotal || 0,
    leadTime: '5-10 business days (estimated)', // default lead time
    notes: inquiry.notes || '',
  }
  
  const subject = `[CloudWing] New Inquiry from ${customerName}`
  
  // 构建产品列表 HTML
  const itemsHtml = inquiry.items?.map((item: any) => {
    const unitPrice = item.unitPrice || 0
    const subtotal = unitPrice * (item.quantity || 0)
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.productName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${unitPrice.toFixed(2)}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${subtotal.toFixed(2)}</td>
      </tr>
    `
  }).join('') || '<tr><td colspan="4" style="padding: 8px;">No items</td></tr>'

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb; margin-bottom: 20px;">🔔 New Inquiry Received</h2>
      
      <h3 style="font-size: 16px; color: #555; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px;">Customer Information</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <tr><td style="padding: 6px 0;"><strong>Name:</strong></td><td style="padding: 6px 0;">${customerName}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email:</strong></td><td style="padding: 6px 0;">${customerEmail}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Company:</strong></td><td style="padding: 6px 0;">${customerCompany}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Phone:</strong></td><td style="padding: 6px 0;">${customerPhone}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Country:</strong></td><td style="padding: 6px 0;">${customerCountry}</td></tr>
      </table>

      <h3 style="font-size: 16px; color: #555; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb;">Product</th>
            <th style="padding: 10px; text-align: center; border-bottom: 1px solid #e5e7eb;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Unit Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0;"><strong>Total Quantity:</strong> ${summary.totalQuantity} pcs</p>
        ${summary.estimatedTotal ? `<p style="margin: 0 0 8px 0;"><strong>Estimated Total:</strong> $${summary.estimatedTotal.toLocaleString()}</p>` : ''}
        <p style="margin: 0 0 8px 0;"><strong>Lead Time:</strong> ${summary.leadTime}</p>
        ${summary.notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${summary.notes}</p>` : ''}
      </div>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      <p style="color: #666; font-size: 12px; margin: 0;">
        This inquiry was submitted via CloudWing website.<br>
        Please respond within 24 hours.
      </p>
      <p style="color: #999; font-size: 11px; margin-top: 10px;">
        Inquiry ID: ${inquiry.id} • ${new Date(inquiry.createdAt).toLocaleString()}
      </p>
    </div>
  `

  // 5. 发送邮件
  try {
    const info = await transporter.sendMail({
      from: `"CloudWing" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject,
      html,
    })
    console.log('✅ Email sent successfully! Message ID:', info.messageId)
  } catch (error: any) {
    console.error('❌ Email send failed:', error.message)
    console.error('Error details:', error)
    throw error
  }
}