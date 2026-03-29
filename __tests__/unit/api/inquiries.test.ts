import { POST, GET } from '@/app/api/inquiries/route';
import { getInquiries, createInquiry, updateInquiryStatus } from '@/lib/db';

// Mock the db module
jest.mock('@/lib/db', () => ({
  getInquiries: jest.fn(),
  createInquiry: jest.fn(),
  updateInquiryStatus: jest.fn(),
}));

describe('Inquiries API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/inquiries', () => {
    it('returns inquiries successfully', async () => {
      const mockInquiries = [
        {
          id: 'INQ-001',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          status: 'pending',
          items: [{ productName: 'iPhone Case', quantity: 100 }],
          summary: { totalQuantity: 100 },
        },
      ];

      (getInquiries as jest.Mock).mockResolvedValue(mockInquiries);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('inquiries');
      expect(data.inquiries).toHaveLength(1);
    });

    it('returns empty array when no inquiries', async () => {
      (getInquiries as jest.Mock).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inquiries).toEqual([]);
    });

    it('handles database errors', async () => {
      (getInquiries as jest.Mock).mockRejectedValue(new Error('DB error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch inquiries' });
    });
  });

  describe('POST /api/inquiries', () => {
    it('creates new inquiry successfully', async () => {
      const inquiryData = {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerCompany: 'Acme Corp',
        customerPhone: '1234567890',
        customerCountry: 'USA',
        items: [
          { productId: 'prod-1', productName: 'Test Product', quantity: 50 },
        ],
        summary: {
          totalQuantity: 50,
          estimatedTotal: 1000,
          leadTime: '2 weeks',
          notes: 'Urgent',
        },
      };

      const createdInquiry = {
        id: 'INQ-20240329-001',
        ...inquiryData,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      (createInquiry as jest.Mock).mockResolvedValue(createdInquiry);

      const response = await POST(inquiryData);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(createdInquiry);
      expect(createInquiry).toHaveBeenCalledWith(inquiryData);
    });

    it('validates required fields', async () => {
      const invalidData = {
        customerName: '',
        customerEmail: 'invalid-email',
        items: [],
      };

      const response = await POST(invalidData as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
    });

    it('handles creation with empty items', async () => {
      const inquiryData = {
        customerName: 'Test',
        customerEmail: 'test@test.com',
        items: [],
        summary: { totalQuantity: 0 },
      };

      const createdInquiry = {
        id: 'INQ-001',
        ...inquiryData,
        status: 'pending',
      };

      (createInquiry as jest.Mock).mockResolvedValue(createdInquiry);

      const response = await POST(inquiryData);
      expect(response.status).toBe(200);
    });

    it('generates inquiry ID with consistent format', async () => {
      const inquiryData = {
        customerName: 'Test',
        customerEmail: 'test@test.com',
        items: [],
        summary: { totalQuantity: 1 },
      };

      const createdInquiry = {
        id: 'INQ-20250627-123456',
        ...inquiryData,
        status: 'pending',
      };

      (createInquiry as jest.Mock).mockResolvedValue(createdInquiry);

      const response = await POST(inquiryData);
      const data = await response.json();

      expect(data.id).toMatch(/^INQ-\d{8}-\d{6}$/);
    });

    it('handles database errors during creation', async () => {
      const inquiryData = {
        customerName: 'Test',
        customerEmail: 'test@test.com',
        items: [],
        summary: { totalQuantity: 0 },
      };

      (createInquiry as jest.Mock).mockRejectedValue(new Error('DB error'));

      const response = await POST(inquiryData);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create inquiry' });
    });
  });
});
