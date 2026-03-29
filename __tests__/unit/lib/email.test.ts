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
      const inquiry = {
        id: 'INQ-001',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          company: 'Test Corp',
          phone: '123-456-7890',
          country: 'USA',
        },
        items: [
          {
            productName: 'iPhone Case',
            quantity: 100,
            unitPrice: 5.99,
          },
        ],
        summary: {
          totalQuantity: 100,
          estimatedTotal: 599,
          leadTime: '2-3 weeks',
          notes: 'Urgent order',
        },
        created_at: new Date().toISOString(),
      };

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
      const inquiry = {
        id: 'INQ-002',
        customer: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          company: 'Acme Inc',
          phone: '555-1234',
          country: 'Canada',
        },
        items: [],
        summary: { totalQuantity: 0 },
        created_at: new Date().toISOString(),
      };

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
      const inquiry = {
        id: 'INQ-003',
        customer: {
          name: 'Test User',
          email: 'test@test.com',
        },
        items: null,
        summary: { totalQuantity: 0 },
        created_at: new Date().toISOString(),
      };

      mockVerify.mockResolvedValue({ response: 'OK' });
      mockSendMail.mockResolvedValue({ messageId: 'msg-789' });

      await sendInquiryNotification(inquiry);

      const sentMail = mockSendMail.mock.calls[0][0];
      expect(sentMail.html).toContain('No items');
    });

    it('handles missing SMTP configuration', async () => {
      // Clear environment variables
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.ADMIN_EMAIL;

      const inquiry = {
        id: 'INQ-004',
        customer: { name: 'Test' },
        items: [],
        summary: { totalQuantity: 0 },
        created_at: new Date().toISOString(),
      };

      // Should log error and return early without throwing
      await expect(sendInquiryNotification(inquiry)).resolves.not.toThrow();
      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('includes inquiry ID and timestamp in footer', async () => {
      const inquiry = {
        id: 'INQ-999',
        customer: { name: 'Test' },
        items: [],
        summary: { totalQuantity: 0 },
        created_at: '2024-01-15T10:30:00Z',
      };

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
