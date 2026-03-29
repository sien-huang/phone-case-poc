import { NextRequest, NextResponse } from 'next/server';
import { readInquiries, writeInquiries } from '@/lib/data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const inquiries = readInquiries();
    const index = inquiries.findIndex(i => i.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    inquiries[index].status = status;
    inquiries[index].updated_at = new Date().toISOString();

    writeInquiries(inquiries);
    return NextResponse.json(inquiries[index]);
  } catch (error) {
    console.error('Failed to update inquiry:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, type = 'note', created_by = 'admin' } = body;

    const inquiries = readInquiries();
    const index = inquiries.findIndex(i => i.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    inquiries[index].communications.push({
      type,
      content,
      created_by,
      created_at: new Date().toISOString(),
    });

    writeInquiries(inquiries);
    return NextResponse.json(inquiries[index]);
  } catch (error) {
    console.error('Failed to add communication:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}