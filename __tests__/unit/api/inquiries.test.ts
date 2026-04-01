// Declare mocks with var to avoid TDZ issues inside jest.mock factories
// eslint-disable-next-line no-var
var mockPrisma: any;
// eslint-disable-next-line no-var
var mockSendNotification: any;

// Mock next/server before any imports
jest.mock('next/server', () => {
  class NextRequestMock {
    url = '';
    method = 'GET';
    headers = {};
    body: any;
    constructor(input: string | any, init?: any) {
      if (typeof input === 'string') {
        this.url = input;
        this.method = (init?.method || 'GET').toUpperCase();
        this.headers = init?.headers || {};
        this.body = init?.body;
      } else {
        this.url = input?.url || '';
        this.method = input?.method || 'GET';
        this.headers = input?.headers || {};
        this.body = input?.body;
      }
    }
    async json() {
      if (typeof this.body === 'string') {
        try { return JSON.parse(this.body); } catch (e) { return {}; }
      }
      return this.body || {};
    }
    async text() {
      return typeof this.body === 'string' ? this.body : '';
    }
    async formData() {
      if (this.body instanceof FormData) return this.body;
      if (typeof this.body === 'object' && this.body !== null) {
        const fd = new FormData();
        for (const key in this.body) {
          if (Object.prototype.hasOwnProperty.call(this.body, key)) {
            fd.append(key, this.body[key]);
          }
        }
        return fd;
      }
      return new FormData();
    }
  }

  class NextResponseMock {
    status = 200;
    body: any;
    constructor(body?: any, init: any = {}) {
      this.body = body;
      this.status = init.status ?? 200;
    }
    static json(data: any, init: any = {}) {
      return new NextResponseMock(JSON.stringify(data), { status: init.status ?? 200 });
    }
    static redirect(url: string, status = 302) {
      return new NextResponseMock(null, { status });
    }
    async json() {
      if (typeof this.body === 'string') {
        try { return JSON.parse(this.body); } catch (e) { return {}; }
      }
      return this.body || {};
    }
  }

  return { NextRequest: NextRequestMock, NextResponse: NextResponseMock };
});

// Mock db before importing route - initialize mockPrisma within factory to break TDZ
jest.mock('@/lib/db', () => {
  mockPrisma = {
    inquiry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { prisma: mockPrisma };
});

// Mock email - initialize mockSendNotification within factory
jest.mock('@/lib/email', () => ({
  sendInquiryNotification: mockSendNotification = jest.fn(),
}));

import { GET, POST } from '@/app/api/inquiries/route';
import { NextRequest } from 'next/server';

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
          status: 'PENDING',
          items: [{ productName: 'iPhone Case', quantity: 100 }],
          totalQuantity: 100,
          estimatedTotal: 1000,
          createdAt: new Date().toISOString(),
        },
      ];
      mockPrisma.inquiry.findMany.mockResolvedValue(mockInquiries);

      const response = await GET(new NextRequest('http://localhost:3000/api/inquiries'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        total: 1,
        inquiries: mockInquiries,
      });
      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: undefined,
          include: expect.any(Object),
          orderBy: expect.any(Object),
          take: expect.any(Number),
        })
      );
    });

    it('returns empty array when no inquiries', async () => {
      mockPrisma.inquiry.findMany.mockResolvedValue([]);
      const response = await GET(new NextRequest('http://localhost:3000/api/inquiries'));
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.inquiries).toEqual([]);
    });

    it('handles database errors', async () => {
      mockPrisma.inquiry.findMany.mockRejectedValue(new Error('DB error'));
      const response = await GET(new NextRequest('http://localhost:3000/api/inquiries'));
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch inquiries' });
    });
  });

  describe('POST /api/inquiries', () => {
    it('creates new inquiry successfully', async () => {
      const inquiryData = {
        customer: {
          name: 'Jane Smith',
          email: 'jane@example.com',
        },
        items: [{ productId: 'prod-1', productName: 'Test', quantity: 50 }],
      };

      const createdInquiry = {
        id: 'INQ-002',
        inquiryNumber: 'INV-123456-ABCD',
        ...inquiryData,
        totalQuantity: 50,
        estimatedTotal: 500,
        status: 'PENDING',
        items: inquiryData.items,
      };

      mockPrisma.product.findUnique.mockResolvedValue({
        priceRange: '$10',
      });
      mockPrisma.$transaction.mockResolvedValue(createdInquiry);

      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost:3000/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(inquiryData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('success', true);
      expect(data.inquiry).toHaveProperty('id');
      expect(mockSendNotification).toHaveBeenCalledWith(createdInquiry);
    });

    it('handles missing required fields', async () => {
      const invalidData = {
        customer: { email: '' },
        items: [],
      };

      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost:3000/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'Email and at least one product are required' });
    });

    it('handles database errors', async () => {
      const validData = {
        customer: { email: 'test@example.com' },
        items: [{ productId: 'prod-1', quantity: 1 }],
      };

      mockPrisma.product.findUnique.mockResolvedValue({ priceRange: '$10' });
      mockPrisma.$transaction.mockRejectedValue(new Error('DB error'));

      const { NextRequest } = require('next/server');
      const request = new NextRequest('http://localhost:3000/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(validData),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Failed to create inquiry' });
    });
  });
});
