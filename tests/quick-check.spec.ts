import { test, expect } from '@playwright/test'

test('Quick smoke test for all critical pages', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // 1. Homepage
  await page.goto('/')
  await expect(page).toHaveTitle(/CloudWing Cases/)

  // Check first container exists
  const container = page.locator('.container').first()
  await expect(container).toBeVisible()
  // Container should have max-width constraint (simplified check)
  const width = await container.evaluate(el => window.getComputedStyle(el).maxWidth)
  expect(['1280px', '80rem', '']).toContain(width) // Acceptable max-widths

  // 2. Language switcher
  const langBtn = page.locator('button:has-text("EN")')
  await expect(langBtn).toBeVisible()
  await langBtn.click()
  await page.locator('text=简体中文').click()
  await page.waitForTimeout(1000)
  const navHome = page.locator('nav a[href="/"]')
  await expect(navHome).toHaveText('首页')

  // 3. Products page
  await page.goto('/products')
  await expect(page).toHaveURL('/products')
  const productCards = page.locator('a[href^="/product/"]')
  const count = await productCards.count()
  expect(count).toBeGreaterThan(0)

  // 4. Product detail via ID
  await page.goto('/product/prod-001')
  await expect(page).toHaveURL(/prod-001/)
  const imgGallery = page.locator('.product-image-gallery, [class*="ProductImageGallery"]')
  await expect(imgGallery).toBeVisible()

  // 5. Admin login
  await page.goto('/admin')
  await expect(page).toHaveURL(/admin\/login/)
  await page.fill('input[type="password"]', 'CloudWing2025!')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/admin\/dashboard/)

  // 6. Dashboard checks
  await page.goto('/admin/dashboard')
  await expect(page.locator('text=Total Products')).toBeVisible()
  // Ensure no JS errors
  expect(errors.filter(e => !e.includes('metabase')).length).toBe(0)

  // 7. Categories API test
  const catResponse = await page.request.get('/api/admin/categories')
  expect(catResponse.ok()).toBeTruthy()

  // Summary
  console.log('✅ All checks passed. Errors:', errors.length)
})
