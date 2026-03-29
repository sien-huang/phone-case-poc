import { NextRequest, NextResponse } from 'next/server';
import { getInquiries } from '@/lib/data';
import { renderToBuffer } from '@react-pdf/renderer';
import InquiryPDF from '@/components/InquiryPDF';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inquiryId } = body;

    const inquiries = getInquiries();
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // 使用 renderToBuffer 直接获取 PDF buffer
    const pdfBuffer = await renderToBuffer(<InquiryPDF inquiry={inquiry} />);
    const base64 = pdfBuffer.toString('base64');

    return NextResponse.json({ pdf: base64 });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}