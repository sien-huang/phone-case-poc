import { POST } from '@/app/api/quote/route';
import { createInquiry } from '@/lib/db';

// Mock the db module
jest.mock('@/lib/db', () => ({
  createInquiry: jest.fn(),
}));

// Mock nodemailer
const mockSendMail = jest.fn();
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail,
    verify: jest.fn().mockResolvedValue({}),
  })),
}));

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
    const formData = new FormData();
    formData.append('companyName', 'Test Corp');
    formData.append('businessType', 'Wholesaler');
    formData.append('targetMarket', 'USA');
    formData.append('products', '["prod-1", "prod-2"]');
    formData.append('quantity', '1000');
    formData.append('timeline', '1 month');
    formData.append('message', 'Need pricing');
    formData.append('email', 'test@test.com');

    const mockProducts = [
      { id: 'prod-1', name: 'Product 1', price_tiers: [{ price: 10 }] },
      { id: 'prod-2', name: 'Product 2', price_tiers: [{ price: 20 }] },
    ];

    // We need to mock getProducts globally
    jest.doMock('@/lib/data', () => ({
      getProducts: jest.fn().mockResolvedValue(mockProducts),
    }));

    const createdInquiry = {
      id: 'INQ-001',
      companyName: 'Test Corp',
      products: ['prod-1', 'prod-2'],
    };

    (createInquiry as jest.Mock).mockResolvedValue(createdInquiry);

    const response = await POST(new Request('http://localhost:3000/api/quote', {
      method: 'POST',
      body: formData,
    }));

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
    expect(data.success).toBe(true);
  });

  it('validates required fields', async () => {
    const formData = new FormData();
    formData.append('companyName', '');
    formData.append('businessType', 'Retailer');
    formData.append('targetMarket', 'EU');
    formData.append('products', '[]');
    formData.append('quantity', '500');

    const response = await POST(new Request('http://localhost:3000/api/quote', {
      method: 'POST',
      body: formData,
    }));

    expect(response.status).toBe(400);
  });

  it('handles database errors gracefully', async () => {
    const formData = new FormData();
    formData.append('companyName', 'Test');
    formData.append('businessType', 'Retailer');
    formData.append('targetMarket', 'USA');
    formData.append('products', '[]');
    formData.append('quantity', '100');

    (createInquiry as jest.Mock).mockRejectedValue(new Error('DB error'));

    const response = await POST(new Request('http://localhost:3000/api/quote', {
      method: 'POST',
      body: formData,
    }));

    expect(response.status).toBe(500);
  });

  it('sends email notification when SMTP configured', async () => {
    const formData = new FormData();
    formData.append('companyName', 'Email Test Corp');
    formData.append('businessType', 'Wholesaler');
    formData.append('targetMarket', 'USA');
    formData.append('products', '["prod-1"]');
    formData.append('quantity', '500');
    formData.append('timeline', '2 weeks');
    formData.append('message', 'Test message');
    formData.append('email', 'corp@test.com');

    const mockProducts = [
      { id: 'prod-1', name: 'Test Product' },
    ];

    jest.doMock('@/lib/data', () => ({
      getProducts: jest.fn().mockResolvedValue(mockProducts),
    }));

    (createInquiry as jest.Mock).mockResolvedValue({ id: 'INQ-999' });

    await POST(new Request('http://localhost:3000/api/quote', {
      method: 'POST',
      body: formData,
    }));

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'test@test.com',
        to: 'admin@test.com',
        subject: expect.stringContaining('New Quote Request'),
      })
    );
  });

  it('does not send email when SMTP not configured', async () => {
    // Clear SMTP env
    process.env.SMTP_HOST = '';
    process.env.SMTP_USER = '';
    process.env.SMTP_PASS = '';

    const formData = new FormData();
    formData.append('companyName', 'Test');
    formData.append('businessType', 'Retailer');
    formData.append('targetMarket', 'USA');
    formData.append('products', '[]');
    formData.append('quantity', '100');

    (createInquiry as jest.Mock).mockResolvedValue({ id: 'INQ-001' });

    await POST(new Request('http://localhost:3000/api/quote', {
      method: 'POST',
      body: formData,
    }));

    expect(mockSendMail).not.toHaveBeenCalled();
  });
});
