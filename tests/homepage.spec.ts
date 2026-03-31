import { test, expect } from '@playwright/test'

test('Critical paths smoke test', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  // Test a few key pages
  await page.goto('/')
  expect(await page.title()).toContain('CloudWing')

  await page.goto('/products')
  await expect(page.locator('main')).toBeVisible()

  await page.goto('/inquiry')
  await expect(page.locator('form')).toBeVisible()

  await page.goto('/admin/login')
  await expect(page.locator('input[type="password"]')).toBeVisible()

  if (errors.length > 0) {
    console.error('Console errors:', errors)
    throw new Error(`Console errors: ${errors.join(', ')}`)
  }
})
