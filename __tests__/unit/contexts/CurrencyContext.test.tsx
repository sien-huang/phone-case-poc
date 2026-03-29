import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CurrencyProvider, useCurrency } from '@/contexts/CurrencyContext';

function TestComponent() {
  const { currency, setCurrency, formatPrice, convert } = useCurrency();
  return (
    <div>
      <span data-testid="currency">{currency}</span>
      <span data-testid="formatted">{formatPrice(1234.56)}</span>
      <span data-testid="converted">{convert(100, 'USD', 'CNY').toFixed(2)}</span>
      <button onClick={() => setCurrency('CNY')}>Switch to CNY</button>
      <button onClick={() => setCurrency('USD')}>Switch to USD</button>
    </div>
  );
}

describe('CurrencyContext', () => {
  beforeEach(() => {
    // Reset any cookies or localStorage
    document.cookie = '';
    localStorage.clear();
  });

  it('provides default CNY currency', async () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    );

    expect(screen.getByTestId('currency').textContent).toBe('CNY');
  });

  it('formats currency correctly for CNY', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    );

    // CNY default - formatPrice uses Intl.NumberFormat
    const formatted = screen.getByTestId('formatted').textContent;
    expect(formatted).toContain('1,234.56');
    expect(formatted).toContain('¥');
  });

  it('converts USD to other currencies', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    );

    // Convert 100 USD to CNY (rate 7.2)
    const converted = parseFloat(screen.getByTestId('converted').textContent || '0');
    expect(converted).toBeCloseTo(720, 0);
  });

  it('switches currency and updates formatting', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    );

    act(() => {
      screen.getByText('Switch to USD').click();
    });

    expect(screen.getByTestId('currency').textContent).toBe('USD');
    const formatted = screen.getByTestId('formatted').textContent;
    expect(formatted).toContain('$');
    expect(formatted).toContain('1,234.56');
  });

  it('persists currency preference in localStorage', () => {
    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    );

    act(() => {
      screen.getByText('Switch to USD').click();
    });

    expect(localStorage.getItem('currency')).toBe('USD');
  });

  it('loads currency preference from localStorage on mount', () => {
    // Set localStorage before render
    localStorage.setItem('currency', 'USD');

    render(
      <CurrencyProvider>
        <TestComponent />
      </CurrencyProvider>
    );

    expect(screen.getByTestId('currency').textContent).toBe('USD');
  });
});
