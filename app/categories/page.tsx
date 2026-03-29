import { Metadata } from 'next'
import Link from 'next/link'
import productsData from '@/data/products.json'

export const metadata: Metadata = {
  title: 'All Categories | CloudWing Cases',
  description: 'Browse our 20+ phone case categories by brand and model. Find the perfect case for any device.',
}

// 获取所有分类及其产品数量
const getCategories = () => {
  const categoryMap = new Map<string, number>()
  productsData.forEach(product => {
    const count = categoryMap.get(product.category) || 0
    categoryMap.set(product.category, count + 1)
  })
  
  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export default function CategoriesPage() {
  const categories = getCategories()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gray-50 py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Browse Categories
            </h1>
            <p className="text-lg text-gray-600">
              {categories.length} categories with {productsData.length}+ products
            </p>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((cat) => (
              <Link
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                key={cat.name}
                className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:border-blue-500 hover:shadow-lg transition-all duration-200"
              >
                <div className="text-center">
                  <h2 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {cat.count} product{cat.count !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Back to Home */}
      <section className="section bg-gray-50">
        <div className="container text-center">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </section>
    </div>
  )
}
