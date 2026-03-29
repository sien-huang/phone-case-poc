import { NextRequest, NextResponse } from 'next/server';
import { getInquiries, getProducts, writeInquiries } from '@/lib/data';
import nodemailer from 'nodemailer';
import { renderToBuffer } from '@react-pdf/renderer';
import InquiryPDF from '@/components/InquiryPDF';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inquiryId } = body;

    const inquiries = getInquiries();
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'SMTP configuration incomplete' },
        { status: 500 }
      );
    }

    // 生成 PDF buffer
    const pdfBuffer = await renderToBuffer(<InquiryPDF inquiry={inquiry} />);

    // 配置邮件发送器
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.verify();

    const mailOptions = {
      from: `"CloudWing" <${SMTP_USER}>`,
      to: [inquiry.customer.email, ADMIN_EMAIL].filter(Boolean).join(', '),
      subject: `Quotation for ${inquiry.customer.company} - CloudWing`,
      text: `Dear ${inquiry.customer.name},\n\nPlease find attached your quotation.\n\nBest regards,\nCloudWing Team`,
      html: `<p>Dear ${inquiry.customer.name},</p>
             <p>Please find attached your quotation.</p>
             <p>Best regards,<br>CloudWing Team</p>`,
      attachments: [
        {
          filename: `quote-${inquiryId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    // 更新 inquiry 状态为 quoted
    const index = inquiries.findIndex(i => i.id === inquiryId);
    if (index !== -1) {
      inquiries[index].status = 'quoted';
      inquiries[index].updated_at = new Date().toISOString();
      inquiries[index].communications.push({
        type: 'email',
        content: `Quote email sent to ${inquiry.customer.email}`,
        created_by: 'admin',
        created_at: new Date().toISOString(),
      });
      writeInquiries(inquiries);
    }

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Send quote failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}