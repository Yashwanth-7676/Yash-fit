import { test, expect } from '@playwright/test'

test.describe('Responsive & Multi-Device Testing', () => {
  test('Mobile Viewport (375x667): Navigation Drawer & Responsive Headers', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // On mobile, the hamburger menu button should be visible
    const hamburgerBtn = page.getByRole('button', { name: /open navigation menu/i })
    await expect(hamburgerBtn).toBeVisible()

    // Open mobile sidebar drawer
    await hamburgerBtn.click()

    // Nav drawer should now be visible with navigation links
    const navDrawer = page.locator('aside[aria-label="Navigation menu"]')
    await expect(navDrawer).toBeVisible()

    // Close mobile drawer via close button
    const closeBtn = page.getByRole('button', { name: /close navigation/i })
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      // Nav drawer should have off-screen translate class
      await expect(navDrawer).toHaveClass(/-translate-x-full/)
    }
  })

  test('Tablet Viewport (768x1024): Fluid Grid & Responsive Forms', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/settings')
    await page.waitForLoadState('domcontentloaded')

    // Verify page content does not cause horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // Within allowable margin

    // Verify form fields scale cleanly
    await expect(page.getByLabel(/First Name/i)).toBeVisible()
    await expect(page.locator('input#age')).toBeVisible()
  })

  test('Desktop Viewport (1280x800): Persistent Sidebar & Modal Interactions', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/settings')
    await page.waitForLoadState('domcontentloaded')

    // Verify desktop sidebar is visible
    const desktopNav = page.locator('aside[aria-label="Sidebar"]')
    await expect(desktopNav).toBeVisible()

    // Test modal interaction on /workout-studio
    await page.goto('/workout-studio')
    await page.waitForLoadState('domcontentloaded')
    const startRoutineBtn = page.getByRole('button', { name: /start routine|start workout/i }).first()
    if (await startRoutineBtn.isVisible()) {
      await startRoutineBtn.click()
      const finishBtn = page.getByRole('button', { name: /finish workout/i })
      if (await finishBtn.isVisible()) {
        await finishBtn.click()
        const modalDialog = page.getByRole('dialog')
        await expect(modalDialog).toBeVisible()

        // Pressing Escape should close modal
        await page.keyboard.press('Escape')
        await expect(modalDialog).not.toBeVisible()
      }
    }
  })
})
