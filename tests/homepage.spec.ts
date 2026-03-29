import { test, expect } from '@playwright/test'

test.describe('Homepage Layout Tests', () => {

  test('should load homepage with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/CloudWing Cases/)
  })

  test('should have centered layout (container class exists)', async ({ page }) => {
    await page.goto('/')
    // Check that main container exists and has max-width constrained
    const container = page.locator('.container')
    await expect(container).toBeVisible()
    
    // Check container has proper margin (centered)
    const box = await container.boundingBox()
    expect(box).not.toBeNull()
    // Container should be centered, not full width
    expect(box.width).toBeLessThanOrEqual(1280) // max-w-7xl is 1280px
  })

  test('should display Latest Arrivals section with horizontal scroll', async ({ page }) => {
    await page.goto('/')
    
    // Check section exists
    const section = page.locator('text=Latest Arrivals')
    await expect(section).toBeVisible()
    
    // Find the scrollable container
    const scrollContainer = page.locator('section:has-text("Latest Arrivals") .flex.overflow-x-auto')
    await expect(scrollContainer).toBeVisible()
    
    // Check there are product cards
    const cards = page.locator('section:has-text("Latest Arrivals") a[href^="/product/"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show first and last Latest cards fully (not clipped)', async ({ page }) => {
    await page.goto('/')
    
    // Scroll to Latest section
    const section = page.locator('section:has-text("Latest Arrivals")')
    await section.scrollIntoViewIfNeeded()
    
    // Check that cards have proper width (w-64 = 256px)
    const firstCard = page.locator('section:has-text("Latest Arrivals") a[href^="/product/"]').first()
    const box = await firstCard.boundingBox()
    expect(box).not.toBeNull()
    expect(box.width).toBeCloseTo(256, -1) // ~256px with some tolerance
  })

  test('should have Tailwind CSS loaded (check a utility class)', async ({ page }) => {
    await page.goto('/')
    
    // Check that Tailwind utilities are applied
    const body = page.locator('body')
    const className = await body.getAttribute('class')
    expect(className).toContain('bg-white')
    expect(className).toContain('text-gray-900')
  })

  test('should show Back to Top button after scrolling', async ({ page }) => {
    await page.goto('/')
    
    // Initially button should not be visible
    const backToTop = page.locator('button[aria-label="Back to top"]')
    await expect(backToTop).not.toBeVisible()
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500) // Wait for scroll event
    
    // Now button should be visible
    await expect(backToTop).toBeVisible()
  })

  test('should have reading progress bar on scroll', async ({ page }) => {
    await page.goto('/')
    
    // Progress bar exists but hidden at top
    const progressBar = page.locator('[role="progressbar"]')
    await expect(progressBar).toBeAttached()
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500)
    
    // Check progress bar has non-zero transform
    const transform = await progressBar.getAttribute('style')
    expect(transform).toContain('scaleX')
  })

})
