import { test, expect } from '@playwright/test'

test('Page hydration works', async ({ page }) => {
  await page.goto('/')
  // 检查页面没有 JS 错误
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await expect(page.locator('main')).toBeVisible()
  if (errors.length > 0) {
    throw new Error(`Console errors: ${errors.join(', ')}`)
  }
})
