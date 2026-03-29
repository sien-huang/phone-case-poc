'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import productsData from '@/data/products.json';
import { useAuth } from '@/contexts/AuthContext';

export default function InquiryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [step, setStep] = useState<'select' | 'form' | 'success'>('select');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 如果是已登录用户，自动填充信息；否则使用表单状态
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.name || '',
    company: user?.company || '',
    email: user?.email || '',
    phone: user?.phone || '',
    country: user?.country || '',
    website: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 用户登录后自动填充
  useEffect(() => {
    if (user) {
      setCustomerInfo(prev => ({
        ...prev,
        name: user.name || prev.name,
        company: user.company || prev.company,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        country: user.country || prev.country,
      }));
    }
  }, [user]);

  // 筛选产品
  const filteredProducts = searchQuery
    ? productsData.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : productsData.slice(0, 20);

  // 计算单价（基于价格阶梯）
  const calculateUnitPrice = (product: any, quantity: number) => {
    if (product.price_tiers && product.price_tiers.length > 0) {
      const tiers = [...product.price_tiers].sort((a, b) => a.minQty - b.minQty);
      let applicableTier = tiers[0];
      for (const tier of tiers) {
        if (quantity >= tier.minQty && tier.price > 0) {
          applicableTier = tier;
        }
      }
      return { unitPrice: applicableTier.price, tierLabel: applicableTier.label };
    }
    const priceMatch = product.priceRange?.match(/\$?([\d.]+)/g);
    const defaultPrice = priceMatch ? parseFloat(priceMatch[0].replace('$', '')) : 0;
    return { unitPrice: defaultPrice, tierLabel: 'Standard' };
  };

  const addToInquiry = (product: any, quantity: number = 100) => {
    const { unitPrice, tierLabel } = calculateUnitPrice(product, quantity);
    setSelectedProducts([...selectedProducts, { ...product, quantity, unitPrice, tierLabel }]);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(selectedProducts.map(p => {
      if (p.id === productId) {
        const { unitPrice, tierLabel } = calculateUnitPrice(p, quantity);
        return { ...p, quantity, unitPrice, tierLabel };
      }
      return p;
    }));
  };

  const removeFromInquiry = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const getItemSubtotal = (item: any) => (item.unitPrice || 0) * (item.quantity || 0);
  const getTotalQuantity = () => selectedProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
  const getTotalEstimated = () => selectedProducts.reduce((sum, p) => sum + getItemSubtotal(p), 0);

  const handleSubmit = async () => {
    if (!customerInfo.email) {
      setError('Email is required');
      return;
    }
    if (selectedProducts.length === 0) {
      setError('Please select at least one product');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        customer: customerInfo,
        items: selectedProducts.map(p => ({
          productId: p.id,
          productName: p.name,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
        })),
        notes: customerInfo.notes,
      };

      // 如果用户已登录，关联 user_id
      if (isAuthenticated && user) {
        payload.user_id = user.id;
      }

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStep('success');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit inquiry');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold mb-4">Inquiry Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your inquiry. We will review your request and get back to you within 24 hours.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Selected:</strong> {selectedProducts.length} product(s)
            </p>
            <p className="text-sm text-gray-600">
              <strong>Email:</strong> {customerInfo.email}
            </p>
            {isAuthenticated && (
              <p className="text-sm text-gray-600">
                <strong>Account:</strong> Linked to your profile
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </button>
            {isAuthenticated && (
              <button
                onClick={() => router.push('/my-inquiries')}
                className="w-full border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                View My Inquiries
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Request a Quote</h1>
          <p className="text-gray-600 mt-2">Select products and fill in your details for a wholesale quotation.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：产品选择 */}
          <div className="lg:col-span-2">
            {/* 搜索 */}
            <div className="bg-white p-4 rounded-xl border mb-6">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 产品列表 */}
            <div className="space-y-4">
              {filteredProducts.slice(0, 20).map((product) => {
                const inInquiry = selectedProducts.find(p => p.id === product.id);
                return (
                  <div key={product.id} className="bg-white p-4 rounded-xl border flex items-start gap-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={`https://picsum.photos/seed/${product.id}/200/200`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.category}</p>
                      <p className="text-sm text-blue-600">{product.priceRange}</p>
                      {product.price_tiers && product.price_tiers.length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {product.price_tiers.slice(0, 3).map((tier: any, idx: number) => (
                            <span key={idx} className="text-xs text-gray-500">
                              {tier.minQty}+: ${tier.price.toFixed(2)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {inInquiry ? (
                        <>
                          <button
                            onClick={() => removeFromInquiry(product.id)}
                            className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                          >
                            Remove
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(product.id, Math.max(1, inInquiry.quantity - 100))}
                              className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="100"
                              value={inInquiry.quantity}
                              onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center px-1 py-0.5 border rounded text-sm"
                            />
                            <button
                              onClick={() => updateQuantity(product.id, inInquiry.quantity + 100)}
                              className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                          <div className="text-right text-sm">
                            <div className="text-gray-600">${(inInquiry.unitPrice || 0).toFixed(2)}/pc</div>
                            <div className="font-semibold text-green-600">${getItemSubtotal(inInquiry).toFixed(2)}</div>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => addToInquiry(product)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧：客户信息表单 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Your Information</h2>

              {isAuthenticated && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  ✓ Logged in as {user?.email}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company *</label>
                  <input
                    type="text"
                    value={customerInfo.company}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, company: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    type="text"
                    value={customerInfo.country}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="url"
                    value={customerInfo.website}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, website: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Additional Notes</label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Any special requirements..."
                  />
                </div>
              </div>

              {/* 选中的产品摘要 */}
              {selectedProducts.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                    {selectedProducts.map((p) => (
                      <div key={p.id} className="text-sm border-b pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-500">
                              ${(p.unitPrice || 0).toFixed(2)}/pc {p.tierLabel && `(${p.tierLabel})`}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="font-medium">{p.quantity}</p>
                            <p className="text-sm text-green-600">${getItemSubtotal(p).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-blue-600">${getTotalEstimated().toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">{getTotalQuantity()} pieces total</p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || selectedProducts.length === 0}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : `Submit Inquiry (${selectedProducts.length} items)`}
              </button>

              <p className="mt-4 text-xs text-gray-500 text-center">
                By submitting, you agree to our Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}