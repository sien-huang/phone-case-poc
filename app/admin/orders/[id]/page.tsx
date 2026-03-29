'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  status: 'pending' | 'confirmed' | 'producing' | 'shipped' | 'delivered' | 'cancelled';
  customer: { name: string; company: string; email: string; phone: string; country?: string; website?: string };
  items: Array<{ productId: string; productName: string; quantity: number; unitPrice?: number }>;
  summary: {
    totalQuantity: number;
    estimatedTotal: number;
    leadTime: string;
    shippingMethod?: string;
    trackingNumber?: string;
  };
  notes: string;
  payment_terms: string;
  shipping_address?: string;
  created_at: string;
  updated_at: string;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        const found = data.orders.find((o: Order) => o.id === id);
        if (found) {
          setOrder(found);
          setTrackingNumber(found.summary.trackingNumber || '');
          setShippingAddress(found.shipping_address || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (updates: any) => {
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      fetchOrder();
    } catch (error) {
      alert('Failed to update order');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    producing: 'bg-orange-100 text-orange-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order {order.order_number}</h1>
            <p className="text-gray-500">Created: {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}</p>
          </div>
          <Link href="/admin/orders" className="text-blue-600 hover:underline">
            ← Back to Orders
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Customer & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="text-lg font-bold mb-4">Customer Information</h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Company</dt>
                  <dd className="font-medium">{order.customer.company}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Contact Person</dt>
                  <dd className="font-medium">{order.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium">{order.customer.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="font-medium">{order.customer.phone}</dd>
                </div>
                {order.customer.country && (
                  <div>
                    <dt className="text-gray-500">Country</dt>
                    <dd className="font-medium">{order.customer.country}</dd>
                  </div>
                )}
                {order.customer.website && (
                  <div>
                    <dt className="text-gray-500">Website</dt>
                    <dd className="font-medium">
                      <a href={order.customer.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                        {order.customer.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Items */}
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="text-lg font-bold mb-4">Order Items</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => {
                    const total = (item.unitPrice || 0) * item.quantity;
                    return (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="py-3">
                          <Link href={`/product/${item.productId}`} target="_blank" className="text-blue-600 hover:underline">
                            {item.productName}
                          </Link>
                        </td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right text-gray-600">
                          {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}
                        </td>
                        <td className="text-right font-medium">${total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={2} className="pt-4 text-right text-gray-600">
                      Total Quantity:
                    </td>
                    <td colSpan={2} className="pt-4 text-right">
                      {order.summary.totalQuantity} pcs
                    </td>
                  </tr>
                  <tr className="font-bold text-lg">
                    <td colSpan={2} className="pt-2 text-right text-gray-600">
                      Grand Total:
                    </td>
                    <td colSpan={2} className="pt-2 text-right text-blue-700">
                      ${order.summary.estimatedTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Right: Actions & Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status & Actions */}
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="text-lg font-bold mb-4">Order Status</h2>
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrder({ status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="producing">Producing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    onBlur={() => updateOrder({ summary: { ...order.summary, trackingNumber: trackingNumber } })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. 1Z999AA1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    onBlur={() => updateOrder({ shipping_address: shippingAddress })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white p-6 rounded-xl border">
              <h2 className="text-lg font-bold mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{order.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lead Time:</span>
                  <span className="font-medium">{order.summary.leadTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Terms:</span>
                  <span className="font-medium">{order.payment_terms}</span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Grand Total:</span>
                    <span className="text-xl font-bold text-green-600">${order.summary.estimatedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border">
              <h2 className="text-lg font-bold mb-4">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    if (confirm('Generate PDF for this order?')) {
                      // TODO: PDF generation for order
                      alert('Feature coming soon');
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                >
                  Download Invoice
                </button>
                <button
                  onClick={() => {
                    const emailBody = prompt('Enter email body:');
                    if (emailBody) {
                      // TODO: Send email
                      alert('Feature coming soon');
                    }
                  }}
                  className="w-full px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                >
                  Send Email to Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}