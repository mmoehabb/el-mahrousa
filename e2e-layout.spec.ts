import { test, expect } from '@playwright/test'

test('desktop game layout overlay panels', async ({ page }) => {
  await page.goto('http://localhost:5173/el-mahrousa/')

  // Login as guest
  await page.getByPlaceholder('Your Name').fill('Desktop Player')
  await page.getByRole('button', { name: 'PLAY AS GUEST' }).click()

  // Create Lobby
  await page.getByRole('button', { name: 'CREATE NEW LOBBY' }).click()

  // Start game immediately
  await page.getByRole('button', { name: 'START GAME' }).click()

  // Wait for countdown
  await page.waitForTimeout(5000)

  // Check that panels are hidden initially but toggle buttons are visible
  await expect(page.locator('button[title="Info/Logs"]')).toBeVisible()
  await expect(page.locator('button[title="Controls"]')).toBeVisible()

  // Open Left Panel
  await page.locator('button[title="Info/Logs"]').click()
  await page.waitForTimeout(500) // Wait for animation

  // Take screenshot of opened left panel
  await page.screenshot({ path: '/home/jules/verification/left_panel_open.png' })

  // Close left panel
  await page.locator('.bg-sand > div > button').first().click() // Close button
  await page.waitForTimeout(500) // Wait for animation

  // Open Right Panel
  await page.locator('button[title="Controls"]').click()
  await page.waitForTimeout(500) // Wait for animation

  // Take screenshot of opened right panel
  await page.screenshot({ path: '/home/jules/verification/right_panel_open.png' })

  // Verify main CTAs exist in center board
  await expect(page.getByRole('button', { name: 'Roll Dice' })).toBeVisible()
})
