import Link from 'next/link'
import ProductImageGallery from '@/components/ProductImageGallery'
import { notFound } from 'next/navigation'
import productsData from '@/data/products.json'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  // 改为动态渲染，不需要预生成所有静态路径
  return []
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const product = productsData.find(p => p.slug === slug)
  
  if (!product) return {}
  
  // 提取价格（简单处理）
  const priceMatch = product.priceRange?.match(/\$?([\d.]+)/)
  const price = priceMatch ? priceMatch[1] : '0.00'

  return {
    title: `${product.name} | CloudWing Cases`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/product/${product.slug}`,
    },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params

  // 确保 productsData 已加载
  if (!productsData || productsData.length === 0) {
    notFound()
  }

  // Support both slug and id lookup
  const product = productsData.find((p: any) => p.slug === slug || p.id === slug)

  if (!product) {
    notFound()
  }

  // 异步记录浏览量（不阻塞页面渲染）
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  fetch(`${baseUrl}/api/track/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: product.id })
  }).catch(() => {})

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <section className="bg-gray-50 py-4">
        <div className="container">
          <nav>
            <ol className="flex space-x-2 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
              <li>/</li>
              <li><Link href="/products" className="hover:text-blue-600">Products</Link></li>
              <li>/</li>
              <li className="text-gray-900">{product.name}</li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Images - 左侧大图 */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <ProductImageGallery 
              images={product.images}
              productName={product.name}
            />
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.slice(0, 4).map((img: string, idx: number) => (
                    <div 
                      key={idx} 
                      className="aspect-square bg-gray-100 rounded-xl overflow-hidden hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} view ${idx + 1}`}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info - 右侧详情 */}
            <div>
              <div className="mb-6">
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  {product.category}
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                {product.name}
              </h1>
              
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {product.priceRange}
              </p>
              <p className="text-gray-500 mb-8">
                MOQ: {(product.moq || 0).toLocaleString()} pieces | Lead time: {product.leadTime}
              </p>

              {/* Description */}
              <div className="prose max-w-none mb-10">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {product.fullDescription || product.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="bg-gray-50 p-8 rounded-2xl mb-10">
                <h3 className="font-bold text-xl mb-6">Specifications</h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Material</p>
                    <p className="font-medium text-gray-900">{product.material}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Finish</p>
                    <p className="font-medium text-gray-900">{product.finish || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Thickness</p>
                    <p className="font-medium text-gray-900">{product.thickness || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Patent</p>
                    <p className="font-medium text-gray-900">{product.patent || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Price Tiers */}
              {product.price_tiers && product.price_tiers.length > 0 && (
                <div className="mb-10">
                  <h3 className="font-bold text-xl mb-4">Price Tiers</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Quantity</th>
                          <th className="text-right py-2">Unit Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.price_tiers.map((tier: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-0">
                            <td className="py-3">{tier.label || `Tier ${idx + 1}`}</td>
                            <td className="text-right font-medium">${tier.price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Compatibility */}
              {product.compatibility && product.compatibility.length > 0 && (
                <div className="mb-10">
                  <h3 className="font-bold text-xl mb-4">Compatible Models</h3>
                  <div className="flex flex-wrap gap-3">
                    {product.compatibility.map((model: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm font-medium"
                      >
                        {model}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {product.features && product.features.length > 0 && (
                <div className="mb-12">
                  <h3 className="font-bold text-xl mb-4">Key Features</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-3 text-lg mt-0.5">✓</span>
                        <span className="text-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div className="border-t pt-10">
                <Link
                  href="/quote"
                  className="inline-flex items-center bg-blue-600 text-white px-10 py-5 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Request a Quote
                  <span className="ml-2">→</span>
                </Link>
                <p className="text-sm text-gray-500 mt-4">
                  Need samples? We offer 3-5 business day prototyping.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {(() => {
        // Get up to 4 related products from same category (excluding current)
        const relatedProducts = productsData
          .filter((p: any) => p.category === product.category && p.id !== product.id)
          .slice(0, 4)

        if (relatedProducts.length === 0) return null

        return (
          <section className="bg-gray-50 py-16">
            <div className="container">
              <h2 className="text-2xl font-bold mb-8 text-gray-900">
                Related {product.category} Products
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((related: any) => (
                  <Link
                    href={`/product/${related.id}`}
                    key={related.id}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      <img
                        src={`https://picsum.photos/seed/${related.id}/400/400`}
                        alt={related.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-xs font-semibold text-blue-600 uppercase">
                        {related.category}
                      </span>
                      <h3 className="font-bold text-lg mt-1 mb-2 text-gray-900 group-hover:text-blue-600 line-clamp-2">
                        {related.name}
                      </h3>
                      <p className="text-xl font-bold text-gray-900">{related.priceRange}</p>
                      <p className="text-sm text-gray-500">MOQ: {related.moq} pcs</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })()}
    </div>
  )
}
