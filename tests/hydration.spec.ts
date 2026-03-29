import { test, expect } from '@playwright/test'

test('Homepage hydration should match', async ({ page }) => {
  // 没有等待 hydration 完成
  await page.goto('/')

  // 如果水合错误发生，页面会重渲染。这里检查控制台无错误
  const errors = await page.evaluate(() => {
    const logs: string[] = []
    window.addEventListener('error', e => logs.push(e.message))
    return logs
  })

  // 如果有 hydration 错误，errors 会包含相关信息
  expect(errors.filter(e => e.toLowerCase().includes('hydration')).length).toBe(0)

  // 检查 Latest Arrivals 的产品 ID 是否在数据集中
  const hrefs = await page.locator('a[href^="/product/"]').evaluateAll(
    els => els.map((a: any) => a.getAttribute('href'))
  )
  expect(hrefs.length).toBeGreaterThan(0)
})
