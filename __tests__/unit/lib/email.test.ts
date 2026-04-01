import { sendInquiryNotification } from '@/lib/email';

// Mock nodemailer
const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    verify: mockVerify,
    sendMail: mockSendMail,
  })),
}));

// Helper to create valid inquiry with correct date field
function createInquiry(overrides = {}) {
  return {
    id: 'INQ-TEST',
    customerEmail: 'test@example.com',
    customerName: 'Test User',
    customerCompany: 'Test Co',
    customerPhone: '1234567890',
    customerCountry: 'Testland',
    items: overrides.items || [
      { productName: 'Test Product', quantity: 2, unitPrice: 10.0 }
    ],
    estimatedTotal: 20,
    notes: 'Test note',
    createdAt: new Date().toISOString(), // correct field name
    ...overrides,
  };
}

describe('Email Service', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@test.com';
    process.env.SMTP_PASS = 'password123';
    process.env.ADMIN_EMAIL = 'admin@test.com';

    // Reset mocks
    mockSendMail.mockClear();
    mockVerify.mockClear();
  });

  describe('sendInquiryNotification', () => {
    it('sends email with correct structure', async () => {
      const inquiry = createInquiry({
        id: 'INQ-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerCompany: 'Test Corp',
        customerPhone: '123-456-7890',
        customerCountry: 'USA',
        items: [
          {
            productName: 'iPhone Case',
            quantity: 100,
            unitPrice: 5.99,
          },
        ],
        estimatedTotal: 599,
        notes: 'Urgent order',
      });

      mockVerify.mockResolvedValue({ response: 'OK' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-123' });

      await sendInquiryNotification(inquiry);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"CloudWing" <test@test.com>',
          to: 'admin@test.com',
          subject: expect.stringContaining('New Inquiry from John Doe'),
          html: expect.stringContaining('iPhone Case'),
          html: expect.stringContaining('100'),
          html: expect.stringContaining('599'),
        })
      );
    });

    it('includes customer information in email', async () => {
      const inquiry = createInquiry({
        id: 'INQ-002',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        customerCompany: 'Acme Inc',
        customerPhone: '555-1234',
        customerCountry: 'Canada',
        items: [],
        estimatedTotal: 0,
      });

      mockVerify.mockResolvedValue({ response: 'OK' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-456' });

      await sendInquiryNotification(inquiry);

      const sentMail = mockSendMail.mock.calls[0][0];
      expect(sentMail.html).toContain('Jane Smith');
      expect(sentMail.html).toContain('jane@example.com');
      expect(sentMail.html).toContain('Acme Inc');
      expect(sentMail.html).toContain('555-1234');
      expect(sentMail.html).toContain('Canada');
    });

    it('handles missing items gracefully', async () => {
      const inquiry = createInquiry({
        id: 'INQ-003',
        customerName: 'Test User',
        customerEmail: 'test@test.com',
        items: null, // missing items
        estimatedTotal: 0,
      });

      mockVerify.mockResolvedValue({ response: 'OK' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-789' });

      await sendInquiryNotification(inquiry);

      const sentMail = mockSendMail.mock.calls[0][0];
      expect(sentMail.html).toContain('No items');
    });

    it('handles missing SMTP configuration', async () => {
      // Temporarily remove required env vars
      const original = {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      };
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.ADMIN_EMAIL;

      const inquiry = createInquiry({
        id: 'INQ-004',
        customerName: 'Test',
        items: [],
        estimatedTotal: 0,
      });

      try {
        // Should log error and return early without throwing
        await expect(sendInquiryNotification(inquiry)).resolves.not.toThrow();
        expect(mockSendMail).not.toHaveBeenCalled();
      } finally {
        // Restore for any subsequent tests (though beforeEach will reset anyway)
        if (original.SMTP_HOST) process.env.SMTP_HOST = original.SMTP_HOST;
        if (original.SMTP_PORT) process.env.SMTP_PORT = original.SMTP_PORT;
        if (original.SMTP_USER) process.env.SMTP_USER = original.SMTP_USER;
        if (original.SMTP_PASS) process.env.SMTP_PASS = original.SMTP_PASS;
        if (original.ADMIN_EMAIL) process.env.ADMIN_EMAIL = original.ADMIN_EMAIL;
      }
    });

    it('includes inquiry ID and timestamp in footer', async () => {
      const inquiry = createInquiry({
        id: 'INQ-999',
        customerName: 'Test',
        items: [],
        estimatedTotal: 0,
        createdAt: '2024-01-15T10:30:00Z', // correct field name
      });

      mockVerify.mockResolvedValue({ response: 'OK' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-999' });

      await sendInquiryNotification(inquiry);

      const sentMail = mockSendMail.mock.calls[0][0];
      expect(sentMail.html).toContain('INQ-999');
      // Check that some date is present (format may vary by locale)
      expect(sentMail.html).toMatch(/2024/);
      expect(sentMail.html).toMatch(/15/);
    });
  });
});
