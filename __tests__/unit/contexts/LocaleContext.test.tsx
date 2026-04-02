import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';

// Import the module to reset cache (not officially exported, but we can access via any means)
// We'll reset the internal cache by re-importing? Instead we can modify the module's internal variable after import.
// Jest allows us to access module internals via ES6 module namespace import? Not easily.
// We'll rely on beforeEach to clear the cache by directly accessing the module's closure if possible.
// Unfortunately, translationsCache is not exported. We can hack by using jest.isolateModules? Too heavy.
// Simpler: modify LocaleContext to reset cache when NODE_ENV === 'test' and a special function is called.
// We'll add a conditional export for testing.

// Mock translations
const mockEnTranslations = {
  'nav.home': 'Home',
  'nav.products': 'Products',
  'nav.quote': 'Get Quote',
};

const mockZhTranslations = {
  'nav.home': '首页',
  'nav.products': '产品',
  'nav.quote': '获取报价',
};

// Mock dynamic import for translations
jest.mock('../../messages/en.json', () => ({ default: { 'nav': { 'home': 'Home', 'products': 'Products', 'quote': 'Get Quote' } } }), { virtual: true });
jest.mock('../../messages/zh-Hans.json', () => ({ default: { 'nav': { 'home': '首页', 'products': '产品', 'quote': '获取报价' } } }), { virtual: true });

function TestComponent() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="home">{t('nav.home')}</span>
      <span data-testid="products">{t('nav.products')}</span>
      <button onClick={() => setLocale('zh-Hans')}>Switch to Chinese</button>
      <button onClick={() => setLocale('en')}>Switch to English</button>
    </div>
  );
}

describe('LocaleContext', () => {
  beforeEach(() => {
    // Reset document.cookie and document.documentElement.lang before each test
    document.cookie = '';
    document.documentElement.lang = 'en';
    // Reset translation cache between tests
    if (LocaleProvider && (LocaleProvider as any).resetCache) {
      (LocaleProvider as any).resetCache();
    }
  });

  it('provides default locale from browser or cookie', async () => {
    render(
      <LocaleProvider>
        <TestComponent />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('locale').textContent).toBe('en');
    });
  });

  it('loads translations for current locale', async () => {
    render(
      <LocaleProvider>
        <TestComponent />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('home').textContent).toBe('Home');
      expect(screen.getByTestId('products').textContent).toBe('Products');
    });
  });

  it('switches locale and updates translations', async () => {
    render(
      <LocaleProvider>
        <TestComponent />
      </LocaleProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('locale').textContent).toBe('en');
    });

    // Switch to Chinese
    act(() => {
      screen.getByText('Switch to Chinese').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('locale').textContent).toBe('zh-Hans');
      expect(screen.getByTestId('home').textContent).toBe('首页');
      expect(screen.getByTestId('products').textContent).toBe('产品');
    });

    // Switch back to English
    act(() => {
      screen.getByText('Switch to English').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('locale').textContent).toBe('en');
      expect(screen.getByTestId('home').textContent).toBe('Home');
    });
  });

  it('throws error when useLocale is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useLocale must be used within a LocaleProvider');

    consoleSpy.mockRestore();
  });

  it('sets HTML lang attribute when locale changes', async () => {
    render(
      <LocaleProvider>
        <TestComponent />
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
    });

    act(() => {
      screen.getByText('Switch to Chinese').click();
    });

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('zh-Hans');
    });
  });
});
