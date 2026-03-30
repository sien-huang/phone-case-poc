import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { LocaleProvider } from '@/contexts/LocaleContext';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <LocaleProvider>
      {component}
    </LocaleProvider>
  );
};

describe('LanguageSwitcher Component', () => {
  beforeEach(() => {
    // Force locale to 'en' via cookie for consistent test startup
    document.cookie = 'locale=en; path=/';
    document.documentElement.lang = 'en';
  });

  it('renders with default language label', async () => {
    renderWithProvider(<LanguageSwitcher />);

    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument();
    });
  });

  it('shows language dropdown on hover', async () => {
    renderWithProvider(<LanguageSwitcher />);

    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('简体中文')).toBeInTheDocument();
      expect(screen.getByText('繁體中文')).toBeInTheDocument();
    });
  });

  it('highlights current language', async () => {
    renderWithProvider(<LanguageSwitcher />);

    await waitFor(() => {
      const currentLangButton = screen.getByText('English').closest('button');
      expect(currentLangButton).toHaveClass('bg-blue-50');
    });
  });

  it('switches language when clicking option', async () => {
    renderWithProvider(<LanguageSwitcher />);

    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    // Click on Chinese option
    const chineseOption = screen.getByText('简体中文');
    act(() => {
      fireEvent.click(chineseOption);
    });

    await waitFor(() => {
      expect(screen.getByText('简')).toBeInTheDocument();
    });

    // Verify HTML lang attribute changed
    expect(document.documentElement.lang).toBe('zh-Hans');
  });

  it('persists language preference in cookie', async () => {
    renderWithProvider(<LanguageSwitcher />);

    await waitFor(() => {
      expect(screen.getByText('EN')).toBeInTheDocument();
    });

    // Switch to Traditional Chinese
    const tradChineseOption = screen.getByText('繁體中文');
    act(() => {
      fireEvent.click(tradChineseOption);
    });

    await waitFor(() => {
      expect(document.cookie).toContain('locale=zh-Hant');
    });
  });

  it('has proper accessibility attributes', () => {
    renderWithProvider(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select Language');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Select Language');
  });

  it('renders globe icon', () => {
    renderWithProvider(<LanguageSwitcher />);

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.getAttribute('fill')).toBe('none');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });
});
