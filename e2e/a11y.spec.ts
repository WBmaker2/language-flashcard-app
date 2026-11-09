import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('home accessibility', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('h1')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
