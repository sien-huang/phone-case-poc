// 扩展产品数据接口
declare module '@/data/products.json' {
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

  const products: Product[]
  export default products
}