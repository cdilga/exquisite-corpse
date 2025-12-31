import { test, expect } from '@playwright/test';

test.describe('Exquisite Corpse E2E Tests', () => {
  test('should display landing page with create and join options', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page.locator('h1')).toContainText('Exquisite Corpse');

    // Check buttons exist
    await expect(page.locator('#create-room-btn')).toBeVisible();
    await expect(page.locator('#join-room-btn')).toBeVisible();
    await expect(page.locator('#room-code-input')).toBeVisible();

    // Check instructions
    await expect(page.getByText('How to Play:')).toBeVisible();
  });

  test('should validate room code input', async ({ page }) => {
    await page.goto('/');

    const roomCodeInput = page.locator('#room-code-input');

    // Type lowercase, should be converted to uppercase
    await roomCodeInput.fill('test');
    await expect(roomCodeInput).toHaveValue('TEST');

    // Should be limited to 4 characters
    await roomCodeInput.fill('TESTING');
    const value = await roomCodeInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(4);
  });

  test('should show error for invalid room code', async ({ page }) => {
    await page.goto('/');

    // Try to join with empty code
    await page.locator('#join-room-btn').click();

    // Should show error
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-message')).toContainText('valid 4-character room code');
  });
});
