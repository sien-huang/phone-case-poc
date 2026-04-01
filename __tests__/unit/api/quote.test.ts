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
      if (this.body instanceof FormData) {
        return this.body;
      }
      // If body is plain object, convert to FormData (for convenience)
      if (typeof this.body === 'object' && this.body !== null) {
        const formData = new FormData();
        for (const key in this.body) {
          if (Object.prototype.hasOwnProperty.call(this.body, key)) {
            formData.append(key, this.body[key]);
          }
        }
        return formData;
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

// Mock dependencies before importing route
// eslint-disable-next-line no-var
var mockCreateInquiry: any;
// eslint-disable-next-line no-var
var mockGetProducts: any;

jest.mock('@/lib/data', () => ({
  createInquiry: mockCreateInquiry = jest.fn(),
  getProducts: mockGetProducts = jest.fn(),
}));

const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
    verify: jest.fn().mockResolvedValue({}),
  })),
}));

import { POST } from '@/app/api/quote/route';
import { NextRequest } from 'next/server';

describe('Quote API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMail.mockClear();
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'password123';
    process.env.ADMIN_EMAIL = 'admin@test.com';
  });

  it('creates quote inquiry successfully', async () => {
    const mockProducts = [
      { id: 'prod-1', name: 'Product 1', price_tiers: [{ price: 10 }] },
      { id: 'prod-2', name: 'Product 2', price_tiers: [{ price: 20 }] },
    ];
    mockGetProducts.mockResolvedValue(mockProducts);

    // Build FormData as the route expects multipart/form-data
    const formData = new FormData();
    formData.append('companyName', 'Test Corp');
    formData.append('businessType', 'Wholesaler');
    formData.append('targetMarket', 'USA');
    formData.append('products', JSON.stringify(['prod-1', 'prod-2']));
    formData.append('quantity', '1000');
    formData.append('timeline', '1 month');
    formData.append('message', 'Need pricing');
    formData.append('email', 'test@test.com');

    mockCreateInquiry.mockResolvedValue({
      id: 'INQ-123',
      customerName: 'Test Corp',
      items: [
        { productName: 'Product 1', quantity: 1000, unitPrice: 10 },
        { productName: 'Product 2', quantity: 1000, unitPrice: 20 },
      ],
      summary: { totalQuantity: 1000, estimatedTotal: 30000 },
    });
    mockSendMail.mockResolvedValue({});

    const request = new NextRequest('http://localhost:3000/api/quote', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200); // route returns 200 with { success, inquiryId }
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('inquiryId');
    expect(mockCreateInquiry).toHaveBeenCalled();
  });

  it('handles missing required fields', async () => {
    const formData = new FormData();
    formData.append('email', '');

    const request = new NextRequest('http://localhost:3000/api/quote', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('handles database errors', async () => {
    const formData = new FormData();
    formData.append('companyName', 'Test');
    formData.append('businessType', 'Retailer');
    formData.append('targetMarket', 'US');
    formData.append('quantity', '100');
    formData.append('email', 'test@test.com');

    mockCreateInquiry.mockImplementation(() => { throw new Error('DB error'); });

    const request = new NextRequest('http://localhost:3000/api/quote', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
