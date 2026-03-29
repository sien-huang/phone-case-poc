import { GET } from '@/app/api/products/route';
import { getProducts } from '@/lib/db';

// Mock the db module
jest.mock('@/lib/db', () => ({
  getProducts: jest.fn(),
}));

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns products successfully', async () => {
    const mockProducts = [
      {
        id: 'prod-1',
        name: 'Test Product',
        category: 'iPhone',
        price_tiers: [{ price: 10.99 }],
        moq: 100,
        isActive: true,
      },
    ];

    (getProducts as jest.Mock).mockResolvedValue(mockProducts);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockProducts);
    expect(getProducts).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when no products', async () => {
    (getProducts as jest.Mock).mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it('handles database errors gracefully', async () => {
    (getProducts as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch products' });
  });

  it('filters only active products', async () => {
    const mockProducts = [
      { id: 'prod-1', isActive: true },
      { id: 'prod-2', isActive: false },
      { id: 'prod-3', isActive: true },
    ];

    (getProducts as jest.Mock).mockResolvedValue(mockProducts);

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveLength(2); // Only active ones
    expect(data.every((p: any) => p.isActive === true)).toBe(true);
  });

  it('returns correct JSON structure', async () => {
    const mockProducts = [
      {
        id: 'prod-1',
        name: 'iPhone Case',
        description: 'A nice case',
        category: 'iPhone',
        price_tiers: [
          { quantity: 100, price: 12.99 },
          { quantity: 500, price: 9.99 },
        ],
        moq: 100,
        leadTime: '2 weeks',
        images: ['image1.jpg'],
        viewCount: 100,
        salesCount: 50,
        updated_at: '2024-01-15T10:00:00Z',
        isActive: true,
      },
    ];

    (getProducts as jest.Mock).mockResolvedValue(mockProducts);

    const response = await GET();
    const data = await response.json();

    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('name');
    expect(data[0]).toHaveProperty('price_tiers');
    expect(data[0]).toHaveProperty('moq');
    expect(data[0]).toHaveProperty('leadTime');
  });
});
