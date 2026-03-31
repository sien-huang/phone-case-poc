import { test, expect } from '@playwright/test'

test('Site loads correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/CloudWing/)
  await expect(page.locator('main')).toBeVisible()
})
