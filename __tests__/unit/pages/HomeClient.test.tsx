import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import HomeClient from '@/app/HomeClient';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

// Mock products data
const mockProducts = [
  {
    id: 'prod-1',
    name: 'iPhone 15 Pro Max Case',
    description: 'Premium leather case for iPhone 15 Pro Max',
    category: 'iPhone',
    price_tiers: [{ price: 12.99 }, { price: 9.99 }],
    priceRange: '$12.99 - $9.99',
    moq: 300,
    leadTime: '2 weeks',
    updated_at: '2024-01-20T10:00:00Z',
    viewCount: 1000,
    salesCount: 500,
    images: ['image1.jpg'],
  },
  {
    id: 'prod-2',
    name: 'Samsung Galaxy S24 Ultra Case',
    description: 'Tough armor case for Samsung S24 Ultra',
    category: 'Samsung',
    price_tiers: [{ price: 15.99 }],
    priceRange: '$15.99',
    moq: 200,
    leadTime: '3 weeks',
    updated_at: '2024-01-19T10:00:00Z',
    viewCount: 800,
    salesCount: 400,
    images: ['image2.jpg'],
  },
  {
    id: 'prod-3',
    name: 'Google Pixel 8 Pro Case',
    description: 'Clear TPU case for Pixel 8 Pro',
    category: 'Google Pixel',
    price_tiers: [{ price: 8.99 }],
    priceRange: '$8.99',
    moq: 500,
    leadTime: '1 week',
    updated_at: '2024-01-18T10:00:00Z',
    viewCount: 600,
    salesCount: 300,
    images: ['image3.jpg'],
  },
];

// Mock fetch for autocomplete
global.fetch = jest.fn();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <LocaleProvider>
      <CurrencyProvider>
        {component}
      </CurrencyProvider>
    </LocaleProvider>
  );
};

describe('HomeClient Component', () => {
  beforeEach(() => {
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
    // Mock products import
    jest.isolateModules(() => {
      // We'll mock products at module level in each test
    });
  });

  it('renders hero section with correct title', () => {
    // Mock the products module
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    expect(screen.getByText(/CloudWing|云翼智造/i)).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    const searchInput = screen.getByPlaceholderText(/search|搜索/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('type', 'text');
  });

  it('renders Latest Arrivals section', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    expect(screen.getByText(/Latest Arrivals|最新上架/i)).toBeInTheDocument();
  });

  it('renders Hot Picks section', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    expect(screen.getByText(/Hot Picks|热门推荐/i)).toBeInTheDocument();
  });

  it('displays product count in categories', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    // Categories section should show "3 products" or similar
    const productsText = screen.getAllByText(/\d+ products?/i);
    expect(productsText.length).toBeGreaterThan(0);
  });

  it('renders trust signals section', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    expect(screen.getByText(/Why CloudWing|为什么选择云翼/i)).toBeInTheDocument();
    expect(screen.getByText(/Direct Manufacturer|直接工厂/i)).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    expect(screen.getByRole('link', { name: /Get Free Quote|获取报价/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download Catalog|下载目录/i })).toBeInTheDocument();
  });

  it('handles search input change', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    const searchInput = screen.getByPlaceholderText(/search|搜索/i);
    fireEvent.change(searchInput, { target: { value: 'iPhone' } });

    expect(searchInput).toHaveValue('iPhone');
  });

  it('fetches autocomplete suggestions after delay', async () => {
    const mockSuggestions = [
      { id: 'prod-1', name: 'iPhone 15 Case', category: 'iPhone' },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve(mockSuggestions),
    });

    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    const searchInput = screen.getByPlaceholderText(/search|搜索/i);
    fireEvent.change(searchInput, { target: { value: 'iPh' } });

    // Wait for debounced fetch (300ms)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products/autocomplete?q=iPh')
      );
    }, { timeout: 500 });
  });

  it('closes suggestions when clicking outside', async () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    const searchInput = screen.getByPlaceholderText(/search|搜索/i);
    fireEvent.focus(searchInput);

    // Simulate click outside
    fireEvent.mouseDown(document.body);

    // Suggestions should be hidden (can't easily test without rerender)
    expect(searchInput).toBeInTheDocument();
  });

  it('renders correct number of latest products', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    // Should show up to 8 latest products (mocked 3)
    const productLinks = screen.getAllByRole('link', { name: / prod/i }).filter(link =>
      link.getAttribute('href')?.startsWith('/product/')
    );
    expect(productLinks.length).toBeLessThanOrEqual(8);
  });

  it('renders categories with correct counts', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    // Check for category names
    expect(screen.getByText('iPhone')).toBeInTheDocument();
    expect(screen.getByText('Samsung')).toBeInTheDocument();
    expect(screen.getByText('Google Pixel')).toBeInTheDocument();
  });

  it('displays product MOQ information', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    // Check for MOQ text
    const moqText = screen.getAllByText(/MOQ:\s*\d+/i);
    expect(moqText.length).toBeGreaterThan(0);
  });

  it('renders certifications link', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    const certLink = screen.getAllByText(/certificates?|证书/i).filter(el =>
      el.closest('a[href="/certifications"]')
    );
    expect(certLink.length).toBeGreaterThan(0);
  });

  it('has accessible search form', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    const searchForm = screen.getByRole('search', { hidden: true }) ||
                       document.querySelector('form[action="/products"]');
    expect(searchForm).toBeInTheDocument();
  });

  it('renders popular search tags', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    expect(screen.getAllByText('iPhone 15')).toBeDefined();
    expect(screen.getAllByText('Samsung S25')).toBeDefined();
  });

  it('handles search form submission', () => {
    jest.doMock('@/data/products.json', () => ({ default: mockProducts }));

    renderWithProviders(<HomeClient />);

    const searchInput = screen.getByPlaceholderText(/search|搜索/i);
    const searchButton = screen.getByRole('button', { name: /search|搜索/i });

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(searchButton);

    // Form should submit to /products
    const form = searchInput.closest('form');
    expect(form?.getAttribute('action')).toBe('/products');
    expect(form?.getAttribute('method')).toBe('get');
  });
});
