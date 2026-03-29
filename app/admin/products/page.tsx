'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  category: string
  description: string
  fullDescription?: string
  compatibility: string[]
  material: string
  finish?: string
  thickness?: string
  moq: number
  leadTime: string
  priceRange: string
  price_tiers?: Array<{
    minQty: number
    price: number
    label?: string
  }>
  images: string[]
  patent?: string
  features: string[]
  status?: 'active' | 'draft' | 'archived'
  viewCount?: number
  salesCount?: number
  is_active?: number
  created_at?: string
  updated_at?: string
}

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    // 从本地 JSON 文件导入数据（模拟 API 响应）
    const init = async () => {
      try {
        const res = await fetch('/api/admin/products')
        const data = await res.json()
        const prods = data.map((p: any) => ({
          ...p,
          status: p.status || 'active',
          viewCount: p.viewCount || 0,
          salesCount: p.salesCount || 0,
        })) as Product[]
        setProducts(prods)
        setCategories([...new Set(prods.map(p => p.category))].sort())
      } catch (error) {
        console.error('Failed to load products:', error)
      }
    }
    init()
  }, [])

  // 筛选逻辑
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = !selectedCategory || p.category === selectedCategory
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchCategory && matchStatus
    })
  }, [products, searchQuery, selectedCategory, statusFilter])

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    }
  }

  const toggleSelectOne = (id: string) => {
    const newSet = new Set(selectedProducts)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedProducts(newSet)
  }

  // 批量操作
  const handleBatchAction = async (action: 'activate' | 'archive' | 'delete') => {
    if (selectedProducts.size === 0) return
    if (!confirm(`Are you sure you want to ${action} ${selectedProducts.size} product(s)?`)) return

    try {
      const res = await fetch('/api/admin/products/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          productIds: Array.from(selectedProducts)
        }),
      })

      if (res.ok) {
        alert(`Successfully ${action}d ${selectedProducts.size} products`)
        setSelectedProducts(new Set())
        // 更新本地状态
        const updated = products.map(p => {
          if (selectedProducts.has(p.id)) {
            if (action === 'activate') return { ...p, status: 'active' as const }
            if (action === 'archive') return { ...p, status: 'archived' as const }
            if (action === 'delete') return { ...p, is_active: 0 }
          }
          return p
        })
        setProducts(updated)
      } else {
        alert(`Failed to ${action} products`)
      }
    } catch (error) {
      alert('Error performing batch action')
    }
  }

  // 保存产品编辑
  const handleSaveProduct = async (product: Product) => {
    try {
      const isNew = !product.id || product.id.startsWith('new-')
      const res = await fetch('/api/admin/products', {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })

      if (res.ok) {
        alert('Product saved successfully!')
        setShowEditor(false)
        setEditingProduct(null)
        // 重新加载产品列表
        const dataRes = await fetch('/api/admin/products')
        const newProds = await dataRes.json()
        setProducts(newProds.map((p: any) => ({
          ...p,
          status: p.status || 'active',
          viewCount: p.viewCount || 0,
          salesCount: p.salesCount || 0,
        })) as Product[])
      } else {
        alert('Failed to save product')
      }
    } catch (error) {
      alert('Error saving product')
    }
  }

  const openEditor = (product?: Product) => {
    if (product) {
      setEditingProduct({ ...product })
    } else {
      const newProduct: Product = {
        id: `new-${Date.now()}`,
        name: '',
        slug: '',
        category: categories[0] || '',
        description: '',
        compatibility: [],
        material: '',
        finish: '',
        thickness: '',
        moq: 500,
        leadTime: '7-10 business days',
        priceRange: '',
        price_tiers: [
          { minQty: 500, price: 0, label: 'MOQ 500' },
          { minQty: 1000, price: 0, label: '1,000 pcs' },
          { minQty: 5000, price: 0, label: '5,000 pcs' },
        ],
        images: [],
        features: [],
        status: 'active',
        viewCount: 0,
        salesCount: 0,
        updated_at: new Date().toISOString(),
      }
      setEditingProduct(newProduct)
    }
    setShowEditor(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 text-sm mt-1">
              {filteredProducts.length} products ({selectedProducts.size} selected)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (confirm('Export all products to JSON?')) {
                  const res = await fetch('/api/admin/products/import')
                  const data = await res.json()
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `products-export-${new Date().toISOString().split('T')[0]}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              📥 Export
            </button>
            <button
              onClick={() => document.getElementById('importFileInput')?.click()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              📤 Import
            </button>
            <input
              id="importFileInput"
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                if (!confirm('This will add/update products. Continue?')) return
                
                const text = await file.text()
                const data = JSON.parse(text)
                const products = data.products || data
                
                const res = await fetch('/api/admin/products/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ products, replace: false }),
                })
                
                if (res.ok) {
                  alert('Import successful!')
                  window.location.reload()
                } else {
                  alert('Import failed')
                }
              }}
            />
            <button
              onClick={() => openEditor()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Product
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {selectedProducts.size > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedProducts.size} item(s) selected
              </span>
              <div className="flex gap-2">
                <button onClick={() => handleBatchAction('activate')} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">Activate</button>
                <button onClick={() => handleBatchAction('archive')} className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">Archive</button>
                <button onClick={() => handleBatchAction('delete')} className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">Delete</button>
              </div>
              <button onClick={() => setSelectedProducts(new Set())} className="ml-auto text-sm text-blue-600 hover:underline">Clear selection</button>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-12 px-6 py-4 text-left">
                    <input type="checkbox" checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
                  </th>
                  <th className="w-64 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="w-36 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="w-40 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="w-28 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="w-24 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Stats</th>
                  <th className="w-28 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Updated</th>
                  <th className="w-28 px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedProducts.has(product.id)} onChange={() => toggleSelectOne(product.id)} className="rounded border-gray-300" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 max-w-xs">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          <img src={`https://picsum.photos/seed/${product.id}/100/100`} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/product/${product.id}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600 block truncate" title={product.name}>{product.name}</Link>
                          <p className="text-sm text-gray-500 truncate">ID: {product.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm inline-block truncate max-w-full">{product.category}</span></td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 min-w-[120px]">
                        <div className="font-medium text-gray-900 truncate">{product.priceRange}</div>
                        {product.price_tiers && product.price_tiers.length > 0 && (
                          <div className="text-xs text-gray-500 truncate">
                            {product.price_tiers.slice(0, 2).map(tier => 
                              tier.price ? `${tier.minQty}+: $${tier.price.toFixed(2)}` : null
                            ).filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select value={product.status} onChange={async (e) => {
                        const newStatus = e.target.value as 'active' | 'draft' | 'archived'
                        try {
                          await fetch('/api/admin/products/batch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: newStatus === 'active' ? 'activate' : newStatus === 'archived' ? 'archive' : 'delete', productIds: [product.id] }),
                          })
                          setProducts(products.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
                        } catch (error) { alert('Failed to update status') }
                      }} className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${product.status === 'active' ? 'bg-green-100 text-green-800' : product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><span className="text-gray-500">👁️</span><span className="tabular-nums">{(product.viewCount || 0).toLocaleString()}</span></div>
                        <div className="flex items-center gap-2"><span className="text-gray-500">🛒</span><span className="tabular-nums">{(product.salesCount || 0).toLocaleString()}</span></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => openEditor(product)} className="text-blue-600 hover:text-blue-800 text-sm font-medium whitespace-nowrap">Edit</button>
                        <Link href={`/product/${product.id}`} target="_blank" className="text-gray-600 hover:text-gray-800 text-sm whitespace-nowrap">View</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No products found</p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory(''); setStatusFilter('all'); }} className="text-blue-600 hover:underline mt-2">Clear filters</button>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border"><div className="text-sm text-gray-500">Total Products</div><div className="text-2xl font-bold">{products.length}</div></div>
          <div className="bg-white p-4 rounded-lg border"><div className="text-sm text-gray-500">Active</div><div className="text-2xl font-bold text-green-600">{products.filter(p => p.status === 'active').length}</div></div>
          <div className="bg-white p-4 rounded-lg border"><div className="text-sm text-gray-500">Total Views</div><div className="text-2xl font-bold text-blue-600">{products.reduce((sum, p) => sum + (p.viewCount || 0), 0).toLocaleString()}</div></div>
          <div className="bg-white p-4 rounded-lg border"><div className="text-sm text-gray-500">Total Sales</div><div className="text-2xl font-bold text-purple-600">{products.reduce((sum, p) => sum + (p.salesCount || 0), 0).toLocaleString()}</div></div>
        </div>

      {/* Product Editor Modal */}
      {showEditor && editingProduct && (
        <ProductEditor product={editingProduct} categories={categories} onSave={handleSaveProduct} onClose={() => { setShowEditor(false); setEditingProduct(null); }} />
      )}
    </div>
  )
}

// Product Editor Component
function ProductEditor({ product, categories, onSave, onClose }: { product: Product; categories: string[]; onSave: (p: Product) => void; onClose: () => void }) {
  const [formData, setFormData] = useState<Product>(product)

  const updateField = (field: keyof Product, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const addToArray = (field: 'compatibility' | 'features', value: string) => {
    updateField(field, [...formData[field], value])
  }

  const removeFromArray = (field: 'compatibility' | 'features', index: number) => {
    updateField(field, formData[field].filter((_: any, i: number) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{formData.id?.startsWith('new-') ? 'Create Product' : 'Edit Product'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input required type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug *</label>
              <input required type="text" value={formData.slug} onChange={(e) => updateField('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select required value={formData.category} onChange={(e) => updateField('category', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">MOQ *</label>
              <input required type="number" value={formData.moq} onChange={(e) => updateField('moq', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price Range *</label>
              <input required type="text" value={formData.priceRange} onChange={(e) => updateField('priceRange', e.target.value)} placeholder="$1.80 - $2.50 per piece" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Price Tiers (MOQ Pricing)</label>
              <div className="space-y-3">
                {(formData.price_tiers || [
                  { minQty: formData.moq || 500, price: 0, label: `MOQ ${formData.moq || 500}` },
                  { minQty: 1000, price: 0, label: '1,000 pcs' },
                  { minQty: 5000, price: 0, label: '5,000 pcs' },
                ]).map((tier, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Min Qty:</label>
                      <input 
                        type="number" 
                        min="1"
                        value={tier.minQty} 
                        onChange={(e) => {
                          const newTiers = [...(formData.price_tiers || [])]
                          newTiers[idx] = { ...tier, minQty: parseInt(e.target.value) || 0 }
                          updateField('price_tiers', newTiers)
                        }}
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Unit Price ($):</label>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={tier.price || ''} 
                        onChange={(e) => {
                          const newTiers = [...(formData.price_tiers || [])]
                          newTiers[idx] = { ...tier, price: parseFloat(e.target.value) || 0 }
                          updateField('price_tiers', newTiers)
                        }}
                        placeholder="0.00"
                        className="w-24 px-2 py-1 border rounded"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Label:</label>
                      <input 
                        type="text" 
                        value={tier.label || ''} 
                        onChange={(e) => {
                          const newTiers = [...(formData.price_tiers || [])]
                          newTiers[idx] = { ...tier, label: e.target.value }
                          updateField('price_tiers', newTiers)
                        }}
                        placeholder="e.g., 500 pcs"
                        className="w-32 px-2 py-1 border rounded"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newTiers = (formData.price_tiers || []).filter((_: any, i: number) => i !== idx)
                        updateField('price_tiers', newTiers)
                      }}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Remove tier"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => {
                    const newTiers = [...(formData.price_tiers || []), { minQty: 0, price: 0, label: '' }]
                    updateField('price_tiers', newTiers)
                  }}
                  className="text-blue-600 text-sm hover:underline"
                >
                  + Add Price Tier
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Define quantity-based pricing. Customers will see different unit prices based on order quantity.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lead Time</label>
              <input type="text" value={formData.leadTime} onChange={(e) => updateField('leadTime', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Material</label>
              <input type="text" value={formData.material} onChange={(e) => updateField('material', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Finish</label>
              <input type="text" value={formData.finish} onChange={(e) => updateField('finish', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Thickness</label>
              <input type="text" value={formData.thickness} onChange={(e) => updateField('thickness', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Patent</label>
              <input type="text" value={formData.patent} onChange={(e) => updateField('patent', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select value={formData.status} onChange={(e) => updateField('status', e.target.value as any)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600">
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Short Description *</label>
            <textarea required rows={2} value={formData.description} onChange={(e) => updateField('description', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Full Description</label>
            <textarea rows={4} value={formData.fullDescription} onChange={(e) => updateField('fullDescription', e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Compatible Models (one per line)</label>
            <div className="space-y-2">
              {formData.compatibility.map((model, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={model} onChange={(e) => { const newCompat = [...formData.compatibility]; newCompat[idx] = e.target.value; updateField('compatibility', newCompat); }} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
                  <button type="button" onClick={() => removeFromArray('compatibility', idx)} className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => addToArray('compatibility', '')} className="text-blue-600 text-sm">+ Add Model</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Key Features (one per line)</label>
            <div className="space-y-2">
              {formData.features.map((feature, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={feature} onChange={(e) => { const newFeatures = [...formData.features]; newFeatures[idx] = e.target.value; updateField('features', newFeatures); }} className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
                  <button type="button" onClick={() => removeFromArray('features', idx)} className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => addToArray('features', '')} className="text-blue-600 text-sm">+ Add Feature</button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URLs (one per line)</label>
            <div className="space-y-2">
              {formData.images.map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="url" value={img} onChange={(e) => { const newImages = [...formData.images]; newImages[idx] = e.target.value; updateField('images', newImages); }} placeholder="https://example.com/image.jpg" className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600" />
                  <button type="button" onClick={() => { const newImages = formData.images.filter((_: any, i: number) => i !== idx); updateField('images', newImages); }} className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => updateField('images', [...formData.images, ''])} className="text-blue-600 text-sm">+ Add Image URL</button>
            </div>
            <p className="text-xs text-gray-500 mt-2">Or <a href="/admin/upload" className="text-blue-600 hover:underline">upload an image</a></p>
          </div>

          <div className="border-t pt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  )
}