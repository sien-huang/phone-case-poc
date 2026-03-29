'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Inquiry {
  id: string
  created_at: string
  updated_at: string
  status: 'pending' | 'contacted' | 'quoted' | 'closed'
  customer: {
    name: string
    company: string
    email: string
    phone: string
    country: string
  }
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice?: number | null
    notes: string
  }>
  summary: {
    totalQuantity: number
    estimatedTotal: number | null
    leadTime: string
    notes: string
  }
  communications: Array<{
    type: string
    content: string
    created_by: string
    created_at: string
  }>
}

export default function InquiriesPage() {
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('user') || '';

  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [userIdFilter, setUserIdFilter] = useState<string>(initialUserId)

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter, userIdFilter]) // 依赖这两个筛选状态

  const fetchInquiries = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (userIdFilter) params.append('user_id', userIdFilter)
      params.append('limit', '100')

      const res = await fetch(`/api/inquiries?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.inquiries)
      } else {
        setError('Failed to fetch inquiries')
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
      setError('Network error. Please check connection.')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (inquiryId: string, newStatus: string) => {
    try {
      // 这里需要创建 PUT API，暂时用刷新模拟
      alert(`Status update for ${inquiryId} to ${newStatus} - API needed`)
      fetchInquiries()
    } catch (error) {
      alert('Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'contacted': return 'bg-blue-100 text-blue-800'
      case 'quoted': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'contacted': return 'Contacted'
      case 'quoted': return 'Quoted'
      case 'closed': return 'Closed'
      default: return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
            <p className="text-gray-600 text-sm mt-1">
              {inquiries.length} total inquiries
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="quoted">Quoted</option>
              <option value="closed">Closed</option>
            </select>
            <button
              onClick={fetchInquiries}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <p className="text-gray-500 text-lg">No inquiries found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{inquiry.customer?.name || 'Unknown'}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                        {getStatusLabel(inquiry.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {inquiry.customer?.company && `${inquiry.customer.company} • `}
                      {inquiry.customer?.country || '-'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {inquiry.customer?.email || '-'} • {inquiry.customer?.phone || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(inquiry.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium">
                      {inquiry.summary.totalQuantity} items
                    </p>
                    {inquiry.summary.estimatedTotal && (
                      <p className="text-lg font-bold text-green-600">
                        ${(inquiry.summary.estimatedTotal || 0).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-1">
                    {inquiry.items.map((item, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex justify-between">
                        <span>{item.productName} × {item.quantity}</span>
                        {item.unitPrice && (
                          <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {inquiry.summary.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                    <strong>Notes:</strong> {inquiry.summary.notes}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <select
                    value={inquiry.status}
                    onChange={(e) => updateStatus(inquiry.id, e.target.value)}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="closed">Closed</option>
                  </select>
                  <Link
                    href={`/admin/inquiries/${inquiry.id}`}
                    className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                  <button
                    disabled
                    className="px-4 py-1 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed"
                  >
                    PDF (coming soon)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}