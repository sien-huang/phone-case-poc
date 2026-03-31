import { test, expect } from '@playwright/test'

test('Basic site functionality', async ({ page }) => {
  await page.goto('/')
  expect(await page.title()).toContain('CloudWing')
  await expect(page.locator('main')).toBeVisible()
})
