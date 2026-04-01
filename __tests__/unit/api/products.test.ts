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

// Mock db before importing route
jest.mock('@/lib/db', () => ({
  getProducts: jest.fn(),
}));

import { GET } from '@/app/api/products/route';
import { getProducts } from '@/lib/db';

describe('GET /api/products', () => {
  it('returns active products with pagination', async () => {
    const mockProducts = [
      { id: '1', name: 'Test 1', slug: 'test-1', isActive: true },
      { id: '2', name: 'Test 2', slug: 'test-2', isActive: true },
    ];
    (getProducts as jest.Mock).mockResolvedValue(mockProducts);

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveLength(2);
  });

  it('returns empty array when no products', async () => {
    (getProducts as jest.Mock).mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it('handles database errors', async () => {
    (getProducts as jest.Mock).mockRejectedValue(new Error('DB error'));
    const response = await GET();
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Failed to fetch products' });
  });
});
