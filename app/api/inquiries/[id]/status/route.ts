import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const INQUIRIES_PATH = join(process.cwd(), 'data', 'inquiries.json');

function readInquiries() {
  try {
    const data = readFileSync(INQUIRIES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeInquiries(inquiries: any[]) {
  writeFileSync(INQUIRIES_PATH, JSON.stringify(inquiries, null, 2));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const allowedStatuses = ['pending', 'contacted', 'quoted', 'closed'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const inquiries = readInquiries();
    const index = inquiries.findIndex((i: any) => i.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    inquiries[index].status = status;
    inquiries[index].updated_at = new Date().toISOString();
    writeInquiries(inquiries);

    return NextResponse.json({ success: true, inquiry: inquiries[index] });
  } catch (error) {
    console.error('Failed to update inquiry status:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}