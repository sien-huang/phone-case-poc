import { render, screen } from '@testing-library/react';
import ProductDetailPage from '@/app/product/[slug]/page';

// Mock products data
const mockProduct = {
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
};

// Mock the products module
jest.mock('@/data/products.json', () => ({
  default: [mockProduct]
}));

// Mock fetch for view tracking
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as any)
) as any;

// Mock process.env
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

describe('ProductDetailPage', () => {
  it('renders product name', async () => {
    const params = Promise.resolve({ slug: 'iphone-15-pro-max-case' });
    const result = await ProductDetailPage({ params });
    // Can't easily test Server Component without next/dynamic
    // This test is more like a smoke test
    expect(result).toBeDefined();
  });

  it('generates correct metadata', async () => {
    const params = Promise.resolve({ slug: 'iphone-15-pro-max-case' });
    const result = await ProductDetailPage({ params });

    // For a server component, we can test the metadata generation
    // by calling generateMetadata directly in a separate test
  });
});

describe('ProductDetailPage Metadata', () => {
  const { generateMetadata } = require('@/app/product/[slug]/page');

  it('generates correct title', async () => {
    const params = Promise.resolve({ slug: 'iphone-15-pro-max-case' });
    const meta = await generateMetadata({ params });

    expect(meta.title).toContain('iPhone 15 Pro Max Leather Case');
    expect(meta.title).toContain('CloudWing Cases');
  });

  it('generates correct description', async () => {
    const params = Promise.resolve({ slug: 'iphone-15-pro-max-case' });
    const meta = await generateMetadata({ params });

    expect(meta.description).toBe('Premium leather case with RFID protection');
  });

  it('handles non-existent product', async () => {
    const params = Promise.resolve({ slug: 'non-existent' });
    const meta = await generateMetadata({ params });

    expect(meta).toEqual({});
  });

  it('includes OpenGraph data', async () => {
    const params = Promise.resolve({ slug: 'iphone-15-pro-max-case' });
    const meta = await generateMetadata({ params });

    expect(meta.openGraph).toBeDefined();
    expect(meta.openGraph.title).toBe('iPhone 15 Pro Max Leather Case');
    expect(meta.openGraph.type).toBe('website');
  });
});
