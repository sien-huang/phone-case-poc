import { test, expect } from '@playwright/test'

test('Quick smoke test for all critical pages', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // 1. Homepage loads
  await page.goto('/')
  await expect(page).toHaveTitle(/CloudWing Cases/)
  const container = page.locator('.container').first()
  await expect(container).toBeVisible()
  errors.forEach(err => console.error('Console error:', err))
  if (errors.length > 0) {
    throw new Error(`Console errors: ${errors.join(', ')}`)
  }

  // 2. Language switcher exists
  const langBtn = page.locator('button[aria-label="Select Language"]').first()
  await expect(langBtn).toBeVisible()

  // 3. Products page
  await page.goto('/products')
  await expect(page.locator('h1')).toContainText('Products')

  // 4. Product detail
  await page.goto('/product/test-product')
  await expect(page.locator('button:has-text("Get Quote")')).toBeVisible()

  // 5. Inquiry page
  await page.goto('/inquiry')
  await expect(page.locator('form')).toBeVisible()

  // 6. Admin login page
  await page.goto('/admin/login')
  await expect(page.locator('input[name="email"]')).toBeVisible()
})
