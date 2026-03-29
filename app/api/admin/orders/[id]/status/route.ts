import { NextRequest, NextResponse } from 'next/server';
import { getOrders, updateOrder, getOrderById } from '@/lib/data';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, shipping_address, tracking_number } = body;

    if (status) {
      const allowedStatuses = ['pending', 'confirmed', 'producing', 'shipped', 'delivered', 'cancelled'];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
    }

    // 先获取原订单
    const order = getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 构建更新
    const updates: Partial<any> = {};
    if (status) updates.status = status;
    if (shipping_address !== undefined || tracking_number !== undefined) {
      updates.summary = {
        ...order.summary,
        ...(shipping_address && { shipping_address }),
        ...(tracking_number && { tracking_number }),
      };
    }

    const success = updateOrder(id, updates);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    const updated = getOrderById(id);
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}