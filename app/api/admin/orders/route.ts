import { NextRequest, NextResponse } from 'next/server';
import { getInquiries, getOrders, createOrder, updateOrderStatus } from '@/lib/data';

export async function GET(request: NextRequest) {
  // 简单权限检查
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = getOrders()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { inquiry_id, order_number, status, shipping_address, payment_terms, notes } = body;

    if (!inquiry_id) {
      return NextResponse.json({ error: 'inquiry_id is required' }, { status: 400 });
    }

    // 查詢詢盤
    const inquiries = getInquiries();
    const inquiry = inquiries.find(i => i.id === inquiry_id);
    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 });
    }

    // 检查是否已生成订单（防止重复）
    if (order_number) {
      const allOrders = getOrders();
      if (allOrders.some(o => o.order_number === order_number)) {
        return NextResponse.json({ error: 'Order number already exists' }, { status: 409 });
      }
    }

    // 构建订单数据
    const order = createOrder({
      inquiry_id,
      user_id: inquiry.user_id || null,
      customer: inquiry.customer,
      items: inquiry.items,
      summary: {
        totalQuantity: inquiry.summary.totalQuantity,
        estimatedTotal: inquiry.summary.estimatedTotal || 0,
        leadTime: inquiry.summary.leadTime,
        shippingMethod: inquiry.summary.shippingMethod,
      },
      notes: notes || inquiry.summary.notes,
      shipping_address,
      payment_terms: payment_terms || '30% deposit, 70% before shipment',
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}