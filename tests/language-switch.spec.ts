import { test, expect } from '@playwright/test'

test('LanguageSwitcher: EN -> zh-Hant (Traditional Chinese)', async ({ page }) => {
  await page.goto('/')

  // Check initial state - should be English
  const homeLink = page.locator('nav a[href="/"]')
  await expect(homeLink).toHaveText('Home')

  // Click first language switcher (there may be two due to test environment)
  const langBtn = page.locator('button[aria-label="Select Language"]').first()
  await expect(langBtn).toBeVisible()
  await langBtn.click()

  // Select 繁體中文
  const traditionalOption = page.locator('text=繁體中文')
  await expect(traditionalOption).toBeVisible()
  await traditionalOption.click()

  // Wait for state update
  await page.waitForTimeout(500)

  // Verify navigation changed to Traditional Chinese
  await expect(homeLink).toHaveText('首頁')

  // Verify HTML lang attribute
  const htmlLang = await page.locator('html').getAttribute('lang')
  expect(htmlLang).toBe('zh-Hant')

  // Verify page content changed
  const heroTitle = page.locator('h1')
  await expect(heroTitle).toContainText('專業手機殼製造商')
})

test('LanguageSwitcher: zh-Hant -> zh-Hans (Simplified Chinese)', async ({ page }) => {
  await page.goto('/')

  // Switch to Traditional first
  const langBtn = page.locator('button[aria-label="Select Language"]')
  await langBtn.click()
  await page.locator('text=繁體中文').click()
  await page.waitForTimeout(500)

  // Now switch to Simplified (click first button again)
  await page.locator('button[aria-label="Select Language"]').first().click()
  await page.locator('text=简体中文').click()
  await page.waitForTimeout(500)

  // Verify
  const homeLink = page.locator('nav a[href="/"]')
  await expect(homeLink).toHaveText('首页')

  const htmlLang = await page.locator('html').getAttribute('lang')
  expect(htmlLang).toBe('zh-Hans')

  const heroTitle = page.locator('h1')
  await expect(heroTitle).toContainText('专业手机壳制造商')
})
