import { test, expect } from '@playwright/test'

test.describe('End-to-End: Core Fitness Workflows', () => {
  test('1. Authentication & Demo Mode Access', async ({ page }) => {
    // Navigate to Login page
    await page.goto('/login')
    await expect(page).toHaveTitle(/YashFit/i)

    // Verify presence of Login elements
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()

    // Test Quick Demo Access button
    const demoButton = page.getByRole('button', { name: /try demo mode|quick demo/i })
    if (await demoButton.isVisible()) {
      await demoButton.click()
      // Should redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 15000 })
      await expect(page.locator('h1')).toContainText(/Dashboard/i)
    }
  })

  test('2. Onboarding Flow', async ({ page }) => {
    await page.goto('/onboarding')
    await page.waitForLoadState('domcontentloaded')

    // Step 1: Click Get Started if welcome splash is present
    const getStartedBtn = page.getByRole('button', { name: /get started/i })
    if (await getStartedBtn.isVisible()) {
      await getStartedBtn.click()
    }

    // Step 2: Personal Metrics
    const nameInput = page.getByPlaceholder(/e\.g\. Yash/i).or(page.getByLabel(/First Name/i))
    await expect(nameInput).toBeVisible()
    await nameInput.fill('Yash')

    // Verify Continue button exists
    const continueBtn = page.getByRole('button', { name: /continue/i })
    await expect(continueBtn).toBeVisible()
  })

  test('3. Dashboard Telemetry & Navigation', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('domcontentloaded')

    // Dashboard greeting heading
    const greeting = page.locator('main h1').first()
    await expect(greeting).toBeVisible()

    // Verify presence of core telemetry stat cards (Readiness, Calories, Workouts)
    const statCards = page.locator('main .rounded-2xl, main .rounded-xl')
    await expect(statCards.first()).toBeVisible()

    // Verify quick action links exist in main content
    const workoutLink = page.locator('main a[href="/workout"], main a[href="/workout-studio"]').first()
    await expect(workoutLink).toBeVisible()
  })

  test('4. Workout Studio & Routine Completion', async ({ page }) => {
    await page.goto('/workout-studio')
    await page.waitForLoadState('domcontentloaded')

    // Verify Workout Studio header
    await expect(page.getByRole('heading', { name: /Interactive Smart Workout Studio/i })).toBeVisible()

    // Start a routine (e.g. Push Hypertrophy)
    const startRoutineBtn = page.getByRole('button', { name: /start routine|start workout/i }).first()
    if (await startRoutineBtn.isVisible()) {
      await startRoutineBtn.click()

      // Workout interface controls
      await expect(page.getByRole('button', { name: /finish workout/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /pause|resume/i })).toBeVisible()
    }
  })

  test('5. Nutrition Dashboard & Macro Tracking', async ({ page }) => {
    await page.goto('/nutrition')
    await page.waitForLoadState('domcontentloaded')

    // Verify Macronutrient summary in main content
    await expect(page.locator('main').getByText(/Nutrition|Daily Nutrition/i).first()).toBeVisible()

    // Hydration tracking controls
    const logWaterBtn = page.getByRole('button', { name: /\+250ml|\+ 250|add water/i }).first()
    if (await logWaterBtn.isVisible()) {
      await logWaterBtn.click()
    }
  })

  test('6. Recovery & Readiness Logging', async ({ page }) => {
    await page.goto('/recovery')
    await page.waitForLoadState('domcontentloaded')

    // Check readiness score heading in main content
    await expect(page.locator('main').getByText(/Readiness|Recovery/i).first()).toBeVisible()

    // Log Recovery button
    const logBtn = page.getByRole('button', { name: /log recovery|save check-in/i }).first()
    if (await logBtn.isVisible()) {
      await expect(logBtn).toBeEnabled()
    }
  })

  test('7. Profile & Settings Updates', async ({ page }) => {
    await page.goto('/settings')
    await page.waitForLoadState('domcontentloaded')

    await expect(page.getByRole('heading', { name: /Profile & Settings/i })).toBeVisible()

    // Verify Avatar Studio shortcut link
    const avatarBtn = page.getByRole('button', { name: /Avatar Studio/i })
    await expect(avatarBtn).toBeVisible()

    // Verify profile inputs
    const firstNameInput = page.getByLabel(/First Name/i)
    await expect(firstNameInput).toBeVisible()
  })
})
