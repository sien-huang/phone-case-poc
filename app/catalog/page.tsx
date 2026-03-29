import Link from 'next/link'
import productsData from '@/data/products.json'

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white py-8">
        <div className="container">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">CloudWing Cases</h1>
              <p className="text-blue-100 mt-1">Product Catalog 2024</p>
            </div>
            <div className="text-right">
              <p className="text-sm">CloudWing (云翼智造)</p>
              <p className="text-sm">Email: 272536022@qq.com</p>
              <p className="text-sm">GMT+8 (Beijing)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Our Collections</h2>
          <p className="text-gray-600 max-w-3xl">
            Premium phone case designs for global brands. All products available for wholesale with customization options.
            Prices in USD. MOQs vary by series.
          </p>
        </div>

        {productsData.map((product) => (
          <div key={product.id} className="mb-16 pb-16 border-b border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Image placeholder */}
              <div className="bg-gray-50 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">📱</span>
                  <span className="text-sm text-gray-500">{product.name}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <span className="text-blue-600 font-semibold text-sm uppercase tracking-wide">
                    {product.category}
                  </span>
                  <h3 className="text-2xl font-bold mt-1 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Wholesale Price</p>
                    <p className="text-xl font-bold text-blue-600">{product.priceRange}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Minimum Order</p>
                    <p className="text-xl font-bold">{product.moq} pcs</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lead Time</p>
                    <p className="font-semibold">{product.leadTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patent</p>
                    <p className="font-semibold">{product.patent}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Compatible Models</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.compatibility.map(model => (
                      <span key={model} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                        {model}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Specifications</h4>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-gray-500 w-1/3">Material</td>
                        <td className="py-2">{product.material}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-gray-500">Finish</td>
                        <td className="py-2">{product.finish}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium text-gray-500">Thickness</td>
                        <td className="py-2">{product.thickness}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Key Features</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {product.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Contact Section */}
        <div className="mt-16 bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Interested in Wholesale?</h2>
          <p className="text-gray-600 mb-6 max-w-3xl">
            Contact us for detailed pricing, sample availability, and customization options.
            We respond to all inquiries within 24 hours.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-semibold mb-1">Email</p>
              <p className="text-gray-600">272536022@qq.com</p>
            </div>
            <div>
              <p className="font-semibold mb-1">WhatsApp</p>
              <p className="text-gray-600">+86 138 0000 0000</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Business Hours</p>
              <p className="text-gray-600">Mon-Fri 9:00-18:00 GMT+8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-12">
        <div className="container text-center">
          <p className="text-sm text-gray-400">
            © 2024 CloudWing (云翼智造). All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
