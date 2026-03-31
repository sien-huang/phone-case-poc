import { test, expect } from '@playwright/test'

test('LanguageSwitcher: EN -> zh-Hant (Traditional Chinese)', async ({ page }) => {
  await page.goto('/')

  // Check initial state - should be English
  const htmlLang = await page.locator('html').getAttribute('lang')
  expect(htmlLang).toBe('en')

  // Click language switcher
  const langBtn = page.locator('button[aria-label="Select Language"]').first()
  await expect(langBtn).toBeVisible()
  await langBtn.click()

  // Select Traditional Chinese
  const traditionalOption = page.locator('button:has-text("繁體中文")').first()
  await expect(traditionalOption).toBeVisible()
  await traditionalOption.click()

  // Wait for state update
  await page.waitForTimeout(500)

  // Verify language switcher now shows 繁 (Traditional selected)
  await expect(langBtn).toContainText('繁')

  // Verify HTML lang attribute changed
  const newHtmlLang = await page.locator('html').getAttribute('lang')
  expect(newHtmlLang).toBe('zh-Hant')
})

test('LanguageSwitcher: zh-Hant -> zh-Hans (Simplified Chinese)', async ({ page }) => {
  await page.goto('/')

  // Switch to Traditional first
  const langBtn = page.locator('button[aria-label="Select Language"]').first()
  await langBtn.click()
  await page.locator('button:has-text("繁體中文")').first().click()
  await page.waitForTimeout(500)

  // Now switch to Simplified
  await langBtn.click()
  await page.locator('button:has-text("简体中文")').first().click()
  await page.waitForTimeout(500)

  // Verify language switcher now shows 简
  await expect(langBtn).toContainText('简')

  // Verify HTML lang attribute changed
  const htmlLang = await page.locator('html').getAttribute('lang')
  expect(htmlLang).toBe('zh-Hans')
})
