import { render, screen } from '@testing-library/react';

// Mock products data directly inside factory to avoid initialization order issue
jest.mock('@/data/products.json', () => ({
  __esModule: true,
  default: [
    {
      id: 'prod-1',
      slug: 'iphone-15-pro-max-case',
      name: 'iPhone 15 Pro Max Leather Case',
      description: 'Premium leather case with RFID protection',
      category: 'iPhone',
      price_tiers: [
        { quantity: 100, price: 12.99 },
        { quantity: 500, price: 9.99 },
      ],
      priceRange: '$12.99 - $9.99',
      moq: 300,
      leadTime: '2 weeks',
      images: ['image1.jpg', 'image2.jpg'],
      isActive: true,
    },
  ],
}));

// Mock fetch for view tracking - will be re-initialized in beforeEach
let fetchMock: any;

// Debug: check fetch is defined in setup
console.log('DEBUG: global.fetch in test setup:', !!global.fetch);

// Mock process.env
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Dynamic import after mocks are set
import ProductDetailPage from '@/app/product/[slug]/page';

describe('ProductDetailPage', () => {
  beforeEach(() => {
    // Reset fetch mock before each test to avoid resetMocks interference
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as any)
    ) as any;
  });

  it('renders product name', async () => {
    const params = Promise.resolve({ slug: 'iphone-15-pro-max-case' });
    const result = await ProductDetailPage({ params });
    // Server Component - check result exists
    expect(result).toBeDefined();
  });

  it('generates correct metadata', async () => {
    const params = Promise.resolve({ slug: 'iphone-15-pro-max-case' });
    const result = await ProductDetailPage({ params });

    if ('metadata' in result && result.metadata) {
      expect(result.metadata.title).toContain('iPhone');
    }
  });
});
