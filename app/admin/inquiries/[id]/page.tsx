'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import InquiryPDF from '@/components/InquiryPDF';

interface Inquiry {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'contacted' | 'quoted' | 'closed';
  customer: {
    name: string;
    company: string;
    email: string;
    phone: string;
    country: string;
    website?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice?: number | null;
    notes?: string;
  }>;
  summary: {
    totalQuantity: number;
    estimatedTotal: number | null;
    leadTime: string;
    notes: string;
  };
  communications: Array<{
    type: string;
    content: string;
    created_by: string;
    created_at: string;
  }>;
}

export default function InquiryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useLocale();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<string>('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingOrder, setGeneratingOrder] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchInquiry();
    }
  }, [id]);

  const fetchInquiry = async () => {
    try {
      const res = await fetch(`/api/admin/inquiries`);
      const data = await res.json();
      const found = data.find((i: Inquiry) => i.id === id);
      if (found) {
        setInquiry(found);
        setStatus(found.status);
      }
    } catch (e) {
      console.error('Failed to fetch inquiry', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus as any);
        fetchInquiry();
      }
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const addCommunication = async () => {
    if (!note.trim()) return;
    try {
      await fetch(`/api/admin/inquiries/${id}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: note, type: 'note' }),
      });
      setNote('');
      fetchInquiry();
    } catch (e) {
      alert('Failed to add note');
    }
  };

  const generateQuotePDF = async () => {
    if (!inquiry) return;
    setGeneratingPDF(true);
    try {
      const res = await fetch('/api/admin/inquiries/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId: inquiry.id }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${inquiry.id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Failed to generate PDF');
      }
    } catch (e) {
      alert('Error generating PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateOrder = async () => {
    if (!inquiry) return;
    setGeneratingOrder(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inquiry_id: inquiry.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrderNumber(data.order.order_number);
        setOrderId(data.order.id);
        alert(`Order ${data.order.order_number} created successfully!`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create order');
      }
    } catch (e) {
      alert('Error creating order');
    } finally {
      setGeneratingOrder(false);
    }
  };

  const sendEmailWithPDF = async () => {
    if (!inquiry) return;
    try {
      const res = await fetch('/api/admin/inquiries/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId: inquiry.id }),
      });
      if (res.ok) {
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email');
      }
    } catch (e) {
      alert('Error sending email');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!inquiry) return <div className="p-8 text-center">Inquiry not found</div>;

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    quoted: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inquiry #{inquiry.id.slice(0, 8)}</h1>
              <p className="text-sm text-gray-500">
                Created: {inquiry.created_at ? new Date(inquiry.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/inquiries" className="text-blue-600 hover:underline">
                ← Back to List
              </Link>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[inquiry.status]}`}>
                {t(`admin.inquiry.${inquiry.status}`)}
              </span>
            </div>
          </div>

          {/* Status Actions */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-gray-700">Update Status:</span>
            {['pending', 'contacted', 'quoted', 'closed'].map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  status === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(`admin.inquiry.${s}`)}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={generateQuotePDF}
              disabled={generatingPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {generatingPDF ? 'Generating...' : '📄 Generate Quote PDF'}
            </button>
            <button
              onClick={sendEmailWithPDF}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              ✉️ Send Email with PDF
            </button>
            <button
              onClick={generateOrder}
              disabled={generatingOrder || !!orderNumber}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {generatingOrder ? 'Creating...' : orderNumber ? `✓ Order ${orderNumber}` : '📦 Create Order'}
            </button>

            {orderId && (
              <Link
                href={`/admin/orders/${orderId}`}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                View Order Details →
              </Link>
            )}

            {/* 隐藏的 PDF 渲染器组件用于生成 */}
            <div style={{ display: 'none' }}>
              <InquiryPDF inquiry={inquiry} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
              <h2 className="text-lg font-bold mb-4">{t('admin.inquiry.customer')}</h2>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-500">{t('inquiry.company')}</dt>
                  <dd className="font-medium">{inquiry.customer.company}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t('inquiry.contact')}</dt>
                  <dd className="font-medium">{inquiry.customer.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="font-medium">{inquiry.customer.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">WhatsApp/Phone</dt>
                  <dd className="font-medium">{inquiry.customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Country</dt>
                  <dd className="font-medium">{inquiry.customer.country}</dd>
                </div>
                {inquiry.customer.website && (
                  <div>
                    <dt className="text-gray-500">Website</dt>
                    <dd className="font-medium">
                      <a href={inquiry.customer.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                        {inquiry.customer.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Notes / Communications */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-bold mb-4">{t('admin.inquiry.notes')}</h2>
              <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
                {inquiry.communications.map((comm, idx) => (
                  <div key={idx} className="border-b pb-3 last:border-0">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{comm.created_by || 'Admin'}</span>
                      <span>{comm.created_at ? new Date(comm.created_at).toLocaleString() : 'N/A'}</span>
                    </div>
                    <p className="text-sm text-gray-700">{comm.content}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <button
                  onClick={addCommunication}
                  className="mt-2 w-full bg-gray-100 text-gray-800 py-2 rounded-lg hover:bg-gray-200"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>

          {/* Items & Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
              <h2 className="text-lg font-bold mb-4">{t('admin.inquiry.products')}</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">{t('product.quantity')}</th>
                    <th className="text-right py-2">{t('product.unitPrice')}</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiry.items.map((item, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-3">
                        <Link href={`/product/${item.productId}`} target="_blank" className="text-blue-600 hover:underline">
                          {item.productName}
                        </Link>
                        {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                      </td>
                      <td className="text-right">{item.quantity}</td>
                      <td className="text-right text-gray-600">
                        {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="text-right font-medium">
                        ${item.unitPrice ? (item.quantity * item.unitPrice).toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={2} className="pt-4 text-right text-gray-600">
                      Total Quantity:
                    </td>
                    <td colSpan={2} className="pt-4 text-right">
                      {inquiry.summary.totalQuantity} pcs
                    </td>
                  </tr>
                  {inquiry.summary.estimatedTotal && (
                    <tr className="font-bold text-lg">
                      <td colSpan={2} className="pt-2 text-right text-gray-600">
                        Estimated Total:
                      </td>
                      <td colSpan={2} className="pt-2 text-right text-blue-700">
                        ${inquiry.summary.estimatedTotal.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-bold mb-4">Summary</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t('product.leadTime')}:</span>
                  <p className="font-medium">{inquiry.summary.leadTime}</p>
                </div>
                {inquiry.summary.notes && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Customer Notes:</span>
                    <p className="font-medium">{inquiry.summary.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}