import ProductsClient from './ProductsClient'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading products...</div>}>
      <ProductsClient />
    </Suspense>
  )
}