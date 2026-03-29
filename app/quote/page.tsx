'use client'

import { useState } from 'react'
import Link from 'next/link'
import productsData from '@/data/products.json'

export default function QuotePage() {
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    targetMarket: '',
    products: [] as string[],
    quantity: '',
    timeline: '',
    message: '',
    file: null as File | null
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formDataToSend = new FormData()
    formDataToSend.append('companyName', formData.companyName)
    formDataToSend.append('businessType', formData.businessType)
    formDataToSend.append('targetMarket', formData.targetMarket)
    formDataToSend.append('products', JSON.stringify(formData.products))
    formDataToSend.append('quantity', formData.quantity)
    formDataToSend.append('timeline', formData.timeline)
    formDataToSend.append('message', formData.message)
    if (formData.file) {
      formDataToSend.append('file', formData.file)
    }

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        body: formDataToSend,
      })
      
      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('Failed to submit. Please try again.')
      }
    } catch (error) {
      alert('Failed to submit. Please try again.')
    }
  }

  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter(id => id !== productId)
        : [...prev.products, productId]
    }))
  }

  if (submitted) {
    return (
      <div className="section">
        <div className="container max-w-2xl text-center">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="heading-lg mb-4">Quote Request Received</h1>
          <p className="text-gray-600 mb-8">
            Thank you for your inquiry! Our sales team will review your request and respond within 24 hours (GMT+8).
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-8 text-left">
            <p className="font-semibold mb-2">What happens next?</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Our team reviews your requirements</li>
              <li>We prepare a detailed quote with pricing and lead time</li>
              <li>If needed, we'll arrange sample shipping (3-5 days)</li>
              <li>You confirm and we start production</li>
            </ol>
          </div>
          <Link href="/products" className="btn btn-primary">
            Continue Browsing Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="heading-lg mb-4">Request Wholesale Quote</h1>
            <p className="text-gray-600">
              Fill out the form below and our sales team will get back to you within 24 hours with pricing and availability. All prices in USD.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Company Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="font-bold text-lg mb-4">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    required
                    value={formData.businessType}
                    onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Select type...</option>
                    <option value="retailer">Retailer / E-commerce Seller</option>
                    <option value="distributor">Distributor / Wholesaler</option>
                    <option value="amazon">Amazon / Marketplace Seller</option>
                    <option value="brand">Brand / OEM</option>
                    <option value="corporate">Corporate / promotional</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Market *
                  </label>
                  <select
                    required
                    value={formData.targetMarket}
                    onChange={(e) => setFormData({...formData, targetMarket: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Select market...</option>
                    <option value="usa">United States</option>
                    <option value="canada">Canada</option>
                    <option value="uk">United Kingdom</option>
                    <option value="eu">Europe (EU)</option>
                    <option value="australia">Australia / NZ</option>
                    <option value="asia">Asia (excl. China)</option>
                    <option value="global">Global / Multiple regions</option>
                    <option value="china">Mainland China</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.message?.includes('http') ? '' : formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    placeholder="https://yourcompany.com"
                  />
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="font-bold text-lg mb-4">Products of Interest</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Products (hold Ctrl/Cmd to select multiple)
                </label>
                <select
                  multiple
                  size={6}
                  value={formData.products}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => opt.value)
                    setFormData({ ...formData, products: selected })
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  {productsData.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.category}) - {product.priceRange}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple products
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Order Quantity *
                </label>
                <select
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                >
                  <option value="">Select quantity range...</option>
                  <option value="300-500">300 - 500 pieces</option>
                  <option value="500-1000">500 - 1,000 pieces</option>
                  <option value="1000-5000">1,000 - 5,000 pieces</option>
                  <option value="5000-10000">5,000 - 10,000 pieces</option>
                  <option value="10000+">10,000+ pieces</option>
                  <option value="discuss">Let's discuss (custom)</option>
                </select>
              </div>
            </div>

            {/* Timeline & Message */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="font-bold text-lg mb-4">Additional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Planned Order Timeline
                  </label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => setFormData({...formData, timeline: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  >
                    <option value="">Select timeline...</option>
                    <option value="urgent">Urgent (within 2 weeks)</option>
                    <option value="1month">Within 1 month</option>
                    <option value="3months">1-3 months</option>
                    <option value="planning">Just planning / no rush</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Files (optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    accept=".pdf,.ai,.png,.jpg,.jpeg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Design files, BOM, or requirement doc (max 10MB)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message / Special Requirements
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  placeholder="Tell us about your needs: custom packaging? logo printing? specific certifications? Pantone colors? etc."
                />
              </div>
            </div>

            {/* Contact Info Preview */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">Why Choose CloudWing?</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ Own factory in Shenzhen - direct pricing, no middleman</li>
                <li>✓ Fast samples - 3-5 business days for prototype</li>
                <li>✓ Flexible MOQ - starting from 300 pieces (depends on series)</li>
                <li>✓ Quality guaranteed - ISO 9001 certified</li>
                <li>✓ Design support - in-house designers available for custom colors</li>
                <li>✓ US & EU focused - CE, RoHS, BSCI compliance</li>
              </ul>
            </div>

            <div className="text-center">
              <button 
                type="submit"
                className="btn btn-primary text-lg px-12 py-4"
              >
                Submit Quote Request
              </button>
              <p className="text-sm text-gray-500 mt-4">
                By submitting, you agree to our privacy policy. All information kept confidential.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
