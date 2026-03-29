import {
  getProducts,
  getProductById,
  createInquiry,
  readProductsFile,
  readInquiriesFile,
} from '@/lib/db';

// Mock Prisma
const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock global prisma
global.prisma = mockPrisma as any;

describe('Database Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProducts', () => {
    it('returns products from database when available', async () => {
      const dbProducts = [
        {
          id: 'prod-1',
          name: 'Test Product',
          isActive: true,
          updatedAt: new Date(),
        },
      ];
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(dbProducts);

      const result = await getProducts();

      expect(result).toEqual(dbProducts);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    });

    it('falls back to file when database is empty', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const fileProducts = [
        { id: 'prod-2', name: 'File Product', is_active: 1 },
      ];
      jest.spyOn(require('@/lib/db'), 'readProductsFile').mockReturnValue(fileProducts);

      const result = await getProducts();

      expect(result.length).toBeGreaterThan(0);
    });

    it('filters only active products from file', async () => {
      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([]);

      const fileProducts = [
        { id: 'prod-1', is_active: 1 },
        { id: 'prod-2', is_active: 0 },
        { id: 'prod-3', is_active: true },
      ];
      jest.spyOn(require('@/lib/db'), 'readProductsFile').mockReturnValue(fileProducts);

      const result = await getProducts();

      expect(result.every((p: any) =>
        p.is_active === 1 || p.is_active === true
      )).toBe(true);
    });
  });

  describe('getProductById', () => {
    it('finds product by ID from database', async () => {
      const product = { id: 'prod-1', name: 'Test' };
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(product);

      const result = await getProductById('prod-1');

      expect(result).toEqual(product);
    });

    it('returns undefined when product not found', async () => {
      (mockPrisma.product.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getProductById('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('createInquiry', () => {
    it('creates inquiry in database', async () => {
      const inquiryData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        items: [],
        summary: { totalQuantity: 10 },
      };

      const createdInquiry = {
        id: 'INQ-001',
        ...inquiryData,
        created_at: new Date(),
        status: 'pending',
      };

      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([{ id: 'prod-1', price_tiers: [{ price: 10 }] }]);
      (mockPrisma.inquiry.create as jest.Mock).mockResolvedValue(createdInquiry);

      const result = await createInquiry(inquiryData as any);

      expect(result).toEqual(createdInquiry);
    });

    it('generates inquiry ID automatically', async () => {
      const inquiryData = {
        customerName: 'Jane Smith',
        items: [{ productId: 'prod-1', quantity: 5 }],
        summary: { totalQuantity: 5 },
      };

      const createdInquiry = {
        id: 'INQ-002', // Auto-generated
        ...inquiryData,
        created_at: new Date(),
      };

      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue([{ id: 'prod-1', price_tiers: [{ price: 20 }] }]);
      (mockPrisma.inquiry.create as jest.Mock).mockResolvedValue(createdInquiry);

      const result = await createInquiry(inquiryData as any);

      expect(result.id).toMatch(/^INQ-\d{6}$/);
    });

    it('calculates estimated total from product prices', async () => {
      const inquiryData = {
        customerName: 'Test',
        items: [
          { productId: 'prod-1', quantity: 10 },
          { productId: 'prod-2', quantity: 5 },
        ],
        summary: { totalQuantity: 15 },
      };

      const mockProducts = [
        { id: 'prod-1', price_tiers: [{ price: 10.99 }] },
        { id: 'prod-2', price_tiers: [{ price: 5.99 }] },
      ];

      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.inquiry.create as jest.Mock).mockImplementation(async (data) => ({
        id: 'INQ-001',
        ...data,
        created_at: new Date(),
      }));

      const result = await createInquiry(inquiryData as any);

      // Expected: (10 * 10.99) + (5 * 5.99) = 109.9 + 29.95 = 139.85
      expect(result.summary.estimatedTotal).toBeCloseTo(139.85, 2);
    });

    it('handles product price tiers correctly', async () => {
      const inquiryData = {
        customerName: 'Test',
        items: [
          { productId: 'prod-1', quantity: 600 }, // Should use second tier
        ],
        summary: { totalQuantity: 600 },
      };

      const mockProducts = [
        {
          id: 'prod-1',
          price_tiers: [
            { quantity: 100, price: 15.99 },
            { quantity: 500, price: 12.99 },
          ],
        },
      ];

      (mockPrisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);
      (mockPrisma.inquiry.create as jest.Mock).mockImplementation(async (data) => ({
        id: 'INQ-001',
        ...data,
        created_at: new Date(),
      }));

      const result = await createInquiry(inquiryData as any);

      // 600 > 500, so use second tier price of 12.99
      expect(result.summary.estimatedTotal).toBeCloseTo(600 * 12.99, 2);
    });
  });

  describe('File-based functions', () => {
    it('readProductsFile returns empty array on error', () => {
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = readProductsFile();
      expect(result).toEqual([]);
    });

    it('readInquiriesFile returns empty array on error', () => {
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = readInquiriesFile();
      expect(result).toEqual([]);
    });
  });
});
