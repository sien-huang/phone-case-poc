import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  },
}))

describe('GET /api/products', () => {
  it('should return active products with pagination', async () => {
    const mockProducts = [
      { id: '1', name: 'Test 1', slug: 'test-1', isActive: true },
      { id: '2', name: 'Test 2', slug: 'test-2', isActive: true },
    ]
    ;(prisma.product.findMany as any).mockResolvedValue(mockProducts)

    const request = new NextRequest('http://localhost:3000/api/products')
    const response = await (await import('@/app/api/products/route')).GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveLength(2)
  })
})
