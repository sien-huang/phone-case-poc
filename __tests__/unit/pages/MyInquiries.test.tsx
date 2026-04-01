import { render, screen, waitFor } from '@testing-library/react';
import MyInquiriesPage from '@/app/my-inquiries/page';
import { LocaleProvider } from '@/contexts/LocaleContext';

// Mock next/navigation
const mockPush = jest.fn();
const mockRouter = { push: mockPush, replace: jest.fn(), back: jest.fn(), forward: jest.fn(), refresh: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  usePathname: () => '/my-inquiries',
}));

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
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        inquiries: [],
      }),
  })
) as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('MyInquiriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockAuth.isAuthenticated = true;
    mockPush.mockClear();
  });

  it('redirects to login when not authenticated', async () => {
    mockAuth.isAuthenticated = false;

    render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?redirect=/my-inquiries');
    });
  });

  it('shows loading state initially', async () => {
    mockAuth.isAuthenticated = true;
    // Make fetch resolve after delay to ensure loading state shown
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ inquiries: [] }),
      }), 100))
    );

    render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    // The loading spinner should be present initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders user inquiries when authenticated', async () => {
    const userInquiries = [
      {
        id: 'INQ-001',
        customerName: 'John Doe',
        status: 'pending',
        items: [{ productName: 'iPhone Case', quantity: 100 }],
        summary: { totalQuantity: 100 },
        user_id: 'user-123', // match mock user id
        created_at: '2024-01-15T10:00:00Z',
      },
    ];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ inquiries: userInquiries }),
    });

    render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      // The inquiry card should show the product name from the mock data
      expect(screen.getByText(/iPhone Case/)).toBeInTheDocument();
    });
  });

  it('handles network errors', async () => {
    // Simulate fetch reject (network error)
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows empty state when no inquiries', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ inquiries: [] }),
    });

    render(
      <LocaleProvider>
        <MyInquiriesPage />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/You haven't submitted any inquiries yet|还没有询盘/i)).toBeInTheDocument();
    });
  });
});
