import { test, expect } from '@playwright/test'

test('deck create, card add, study flow', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '+ 새 덱' }).click()
  await page.getByRole('textbox', { name: '덱 이름' }).fill('E2E Deck')
  await page.getByRole('button', { name: '만들기' }).click()
  await page.getByRole('textbox', { name: '앞 (질문)' }).fill('q')
  await page.getByRole('textbox', { name: '뒤 (답)' }).fill('a')
  await page.getByRole('button', { name: '추가' }).click()
  await expect(page.getByText('카드 (1)')).toBeVisible()
  await page.getByRole('button', { name: '학습' }).click()
  await page.locator('.flashcard').click()
  await page.getByRole('button', { name: 'Good' }).click()
  await expect(page.getByText('완료!')).toBeVisible()
})
