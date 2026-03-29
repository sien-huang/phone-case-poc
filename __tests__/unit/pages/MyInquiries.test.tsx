import { render, screen, waitFor } from '@testing-library/react';
import MyInquiriesPage from '@/app/my-inquiries/page';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocaleProvider } from '@/contexts/LocaleContext';

// Mock auth
const mockAuth = {
  isAuthenticated: true,
  user: { id: 'user-123', name: 'Test User', email: 'test@test.com' },
  login: jest.fn(),
  logout: jest.fn(),
};

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
  AuthProvider: ({ children }: any) => children,
}));

// Mock fetch
global.fetch = jest.fn();

describe('MyInquiriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('redirects to login when not authenticated', async () => {
    mockAuth.isAuthenticated = false;
    const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');
    const push = jest.fn();
    useRouter.mockReturnValue({ push });

    await render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login?redirect=/my-inquiries');
    });

    useRouter.mockRestore();
  });

  it('shows loading state initially', async () => {
    mockAuth.isAuthenticated = true;
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ inquiries: [] }),
      }), 100))
    );

    await render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    // Loading spinner should be visible initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays inquiries when loaded', async () => {
    mockAuth.isAuthenticated = true;

    const mockInquiries = [
      {
        id: 'INQ-001',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
        status: 'pending',
        items: [{ productName: 'iPhone Case', quantity: 100 }],
        summary: { totalQuantity: 100, estimatedTotal: 999 },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        inquiries: mockInquiries
      }),
    });

    await render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText('My Inquiries')).toBeInTheDocument();
    expect(screen.getByText('INQ-001')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('shows empty state when no inquiries', async () => {
    mockAuth.isAuthenticated = true;

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ inquiries: [] }),
    });

    await render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no inquiries|empty/i)).toBeInTheDocument();
  });

  it('handles fetch errors', async () => {
    mockAuth.isAuthenticated = true;

    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    await render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('filters inquiries by current user', async () => {
    mockAuth.isAuthenticated = true;
    mockAuth.user = { id: 'user-123' };

    const allInquiries = [
      { id: 'INQ-001', user_id: 'user-123', status: 'pending' },
      { id: 'INQ-002', user_id: 'user-456', status: 'pending' },
      { id: 'INQ-003', user_id: 'user-123', status: 'quoted' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ inquiries: allInquiries }),
    });

    await render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Should only show current user's inquiries
    expect(screen.getByText('INQ-001')).toBeInTheDocument();
    expect(screen.queryByText('INQ-002')).not.toBeInTheDocument();
    expect(screen.getByText('INQ-003')).toBeInTheDocument();
  });
});
