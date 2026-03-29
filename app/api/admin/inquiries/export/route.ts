import { NextRequest, NextResponse } from 'next/server';
import { getInquiries } from '@/lib/data';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '1000');

    const inquiries = getInquiries()
      .filter(i => !status || i.status === status)
      .slice(0, limit);

    // 转换为表格数据
    const rows = inquiries.map(i => ({
      ID: i.id.slice(0, 8).toUpperCase(),
      Date: new Date(i.created_at).toLocaleDateString(),
      Status: i.status,
      Customer: i.customer.company,
      Contact: i.customer.name,
      Email: i.customer.email,
      Phone: i.customer.phone,
      Country: i.customer.country,
      'Total Quantity': i.summary.totalQuantity,
      'Estimated Total': i.summary.estimatedTotal ? `$${i.summary.estimatedTotal.toFixed(2)}` : '',
      'Lead Time': i.summary.leadTime,
    }));

    // 生成 Worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inquiries');

    // 写为 buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="inquiries.xlsx"',
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}