'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Inquiry {
  id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'contacted' | 'quoted' | 'closed';
  items: Array<{ productName: string; quantity: number; unitPrice?: number }>;
  summary: { totalQuantity: number; estimatedTotal?: number };
  communications: any[];
}

export default function MyInquiriesPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/my-inquiries');
      return;
    }
    fetchInquiries();
  }, [isAuthenticated]);

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/inquiries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // 只显示当前用户的询盘（在前端过滤）
        const userInquiries = data.inquiries.filter((i: any) => i.user_id === user?.id);
        setInquiries(userInquiries);
      } else {
        setError('Failed to load inquiries');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Inquiries</h1>
            <p className="text-gray-600 mt-2">Track your quote requests and history.</p>
          </div>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't submitted any inquiries yet.</p>
            <Link href="/" className="text-blue-600 hover:underline font-medium">
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-xl border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Inquiry #{inquiry.id.slice(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(inquiry.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      inquiry.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : inquiry.status === 'quoted'
                        ? 'bg-green-100 text-green-800'
                        : inquiry.status === 'contacted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {inquiry.status.charAt(0).toUpperCase() + inquiry.status.slice(1)}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Products:</h4>
                  <div className="space-y-1">
                    {inquiry.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex justify-between">
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        {item.unitPrice && (
                          <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {inquiry.summary.estimatedTotal && (
                  <div className="mb-4 text-right">
                    <span className="text-sm text-gray-600">Estimated Total: </span>
                    <span className="text-xl font-bold text-green-600">
                      ${(inquiry.summary.estimatedTotal || 0).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="border-t pt-4 mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {inquiry.communications?.length || 0} communications
                  </div>
                  {inquiry.status !== 'closed' && (
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to close this inquiry?')) {
                          try {
                            const token = localStorage.getItem('auth_token');
                            await fetch(`/api/inquiries/${inquiry.id}/status`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                              },
                              body: JSON.stringify({ status: 'closed' }),
                            });
                            fetchInquiries();
                          } catch (err) {
                            alert('Failed to close inquiry');
                          }
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Close Inquiry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}