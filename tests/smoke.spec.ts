import { test, expect } from '@playwright/test'

test.describe('Critical Path E2E (Simplified)', () => {
  test('homepage loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await expect(page).toHaveTitle(/CloudWing Cases/)

    const main = page.locator('main')
    await expect(main).toBeVisible()

    if (errors.length > 0) {
      console.error('Console errors:', errors)
    }
    expect(errors).toHaveLength(0)
  })

  test('products page loads', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('product detail page loads', async ({ page }) => {
    await page.goto('/product/test-product')
    // 404 or product should be visible
    await expect(page.locator('main')).toBeVisible()
  })

  test('inquiry page loads', async ({ page }) => {
    await page.goto('/inquiry')
    await expect(page.locator('form')).toBeVisible()
  })

  test('admin login page loads', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })
})
