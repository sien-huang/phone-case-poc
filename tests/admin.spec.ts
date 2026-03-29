import { test, expect } from '@playwright/test'

test.describe('Admin Panel Tests', () => {

  test('should login successfully', async ({ page }) => {
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL(/admin\/login/)
    
    // Enter password
    await page.fill('input[type="password"]', 'CloudWing2025!')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/admin\/dashboard/)
  })

  test('should display dashboard without errors', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Check key metric cards exist
    const totalProducts = page.locator('text=Total Products')
    await expect(totalProducts).toBeVisible()
    
    // Check no console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    
    // Assert no JS errors
    expect(errors).toHaveLength(0)
  })

  test('should load products list', async ({ page }) => {
    await page.goto('/admin/products')
    
    // Check table exists
    const table = page.locator('table')
    await expect(table).toBeVisible()
    
    // Check for product rows
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should toggle language switcher', async ({ page }) => {
    await page.goto('/')
    
    // Click language switcher
    const langSwitch = page.locator('button:has-text("EN")')
    await expect(langSwitch).toBeVisible()
    await langSwitch.click()
    
    // Select Chinese
    const chineseOption = page.locator('text=简体中文')
    await chineseOption.click()
    
    // Check that nav updated
    const homeLink = page.locator('nav a[href="/"]')
    await expect(homeLink).toHaveText('首页')
  })

})
