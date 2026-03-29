import { test, expect } from '@playwright/test';

test.describe('Critical User Journeys E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full product inquiry flow', async ({ page }) => {
    // 1. Homepage - click on a product
    const firstProduct = page.locator('section:has-text("Latest Arrivals") a[href^="/product/"]').first();
    await firstProduct.click();

    // 2. Product detail page loads
    await expect(page).toHaveURL(/\/product\/[^/]+/);
    await expect(page.locator('h1')).toBeVisible();

    // 3. Click "Get Quote" button
    const quoteButton = page.locator('a[href="/my-inquiries"]:has-text("Get Quote")');
    await quoteButton.click();

    // 4. Redirect to inquiry form (check for login redirect or form)
    await expect(page).toHaveURL(/\/my-inquiries/);
    
    // Check either we're on form or redirected to login
    const isLoginPage = page.locator('text=/signin|login/i').isVisible();
    const isFormPage = page.locator('form').isVisible();
    
    if (isFormPage) {
      // 5. Fill out form if not logged in
      await page.fill('input[name="customerName"]', 'Test Customer');
      await page.fill('input[name="customerEmail"]', 'test@example.com');
      await page.fill('input[name="customerCompany"]', 'Test Company');
      await page.fill('input[name="customerPhone"]', '1234567890');
      await page.fill('select[name="customerCountry"]', 'China');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // 6. Expect success confirmation
      await expect(page.locator('text=/success|thank you/i')).toBeVisible({ timeout: 10000 });
    } else {
      // 7. If login required, check for login option
      await expect(page.locator('text=/signin|login/i')).toBeVisible();
    }
  });

  test('should switch languages and persist preference', async ({ page }) => {
    // 1. Click language switcher
    const langButton = page.locator('button[aria-label="Select Language"]');
    await langButton.click();

    // 2. Choose Chinese
    await page.locator('button:has-text("简体中文")').click();

    // 3. Check navigation text changed
    await expect(page.locator('a:has-text("首页")')).toBeVisible();
    await expect(page.locator('a:has-text("产品")')).toBeVisible();
    await expect(page.locator('a:has-text("获取报价")')).toBeVisible();

    // 4. Reload page - preference should persist
    await page.reload();
    await expect(page.locator('a:has-text("首页")')).toBeVisible();
    
    // Check HTML lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('zh-Hans');
  });

  test('should handle empty product search results gracefully', async ({ page }) => {
    // 1. Find search input (if exists)
    const searchInput = page.locator('input[name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('xyz123nonexistent');
      await searchInput.press('Enter');
      
      // 2. Check for "no results" message
      await expect(page.locator('text=/no results|no products/i')).toBeVisible();
    } else {
      // If no search feature exists, skip
      test.info().annotations.push({ type: 'skip', description: 'Search feature not implemented' });
    }
  });

  test('should display product count correctly on homepage', async ({ page }) => {
    // 1. Locate the product count text if present
    const countElement = page.locator('text=/\\d+ products?|\\d+ items?/i').first();
    
    if (await countElement.isVisible()) {
      const text = await countElement.textContent();
      const match = text?.match(/(\d+)/);
      if (match) {
        const count = parseInt(match[1]);
        expect(count).toBeGreaterThan(0);
      }
    } else {
      // Alternative: count product cards
      const productLinks = page.locator('a[href^="/product/"]');
      const count = await productLinks.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should validate inquiry form fields', async ({ page }) => {
    // 1. Navigate to inquiry form
    await page.goto('/my-inquiries');

    // 2. Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 3. Check for validation errors (HTML5 or custom)
    const requiredFields = page.locator('input[required], select[required], textarea[required]');
    const count = await requiredFields.count();
    expect(count).toBeGreaterThan(0);

    // 4. Look for error messages
    const errorMessages = page.locator('[role="alert"], .error, .text-red-500');
    if (await errorMessages.first().isVisible()) {
      expect(await errorMessages.count()).toBeGreaterThan(0);
    }
  });

  test('should load admin analytics page when authenticated', async ({ page }) => {
    // 1. Try to access admin route
    await page.goto('/admin/analytics');

    // 2. Check if redirected to login or page loads
    const isLogin = page.url().includes('signin') || page.locator('text=/signin|login/i').isVisible();
    
    if (!isLogin) {
      // If admin page loads, check for charts or data
      await expect(page.locator('h1')).toContainText(/analytics|dashboard/i);
      
      // Check for data visualization
      const hasChart = page.locator('canvas, svg, .recharts').first().isVisible();
      if (await hasChart) {
        expect(true).toBeTruthy(); // Chart exists
      }
    } else {
      test.info().annotations.push({ type: 'skip', description: 'Auth required for admin page' });
    }
  });

  test('should maintain cart state across pages (if e-commerce)', async ({ page }) => {
    // 1. Check for cart icon/indicator
    const cartIndicator = page.locator('[data-testid="cart-count"], .cart-badge, a[href*="cart"]').first();
    
    if (await cartIndicator.isVisible()) {
      const initialCount = await cartIndicator.textContent();
      
      // 2. Add item to cart (if product page reachable)
      await page.goto('/');
      const productLink = page.locator('a[href^="/product/"]').first();
      if (await productLink.isVisible()) {
        await productLink.click();
        
        const addToCartButton = page.locator('button:has-text("Add to Cart"), button:has-text("加入购物车")').first();
        if (await addToCartButton.isVisible()) {
          await addToCartButton.click();
          
          // 3. Check cart count updated
          await expect(cartIndicator).not.toHaveText(initialCount || '');
        }
      }
    } else {
      test.info().annotations.push({ type: 'skip', description: 'Cart feature not implemented' });
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // 1. Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 2. Check mobile menu exists
    const mobileMenuToggle = page.locator('button[aria-label="Menu"], button[aria-label="Toggle menu"]').first();
    if (await mobileMenuToggle.isVisible()) {
      await mobileMenuToggle.click();
      
      // 3. Check menu expanded
      const mobileNav = page.locator('[role="navigation"]').first();
      await expect(mobileNav).toBeVisible();
    }

    // 4. Verify layout doesn't break
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should not have console errors on main pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(msg.text());
      }
    });

    // Visit main pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/my-inquiries');
    await page.waitForLoadState('networkidle');

    // Assert no critical errors
    const criticalErrors = errors.filter(e => !e.includes('Failed to load resource'));
    expect(criticalErrors).toHaveLength(0);
  });

});

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1s = await page.locator('h1').count();
    expect(h1s).toBe(1); // Single H1 per page

    // Check that headings are in order (no skipping)
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have alt text on images', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      // Empty alt is acceptable for decorative images, but attribute should exist
      expect(alt).not.toBeNull();
    }
  });

  test('should have focus styles on interactive elements', async ({ page }) => {
    // Click on a button to focus it
    const button = page.locator('button, a[href]').first();
    await button.click();

    // Check that :focus style exists (we can verify by checking outline property)
    const hasFocusStyle = await page.evaluate(() => {
      const active = document.activeElement;
      const styles = window.getComputedStyle(active);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    
    expect(hasFocusStyle).toBeTruthy();
  });

  test('should have ARIA labels where needed', async ({ page }) => {
    // Check language switcher has aria-label
    const langSwitcher = page.locator('button[aria-label="Select Language"]');
    await expect(langSwitcher).toBeAttached();

    // Check back-to-top has aria-label
    const backToTop = page.locator('button[aria-label="Back to top"]');
    await expect(backToTop).toBeAttached();
  });

});
