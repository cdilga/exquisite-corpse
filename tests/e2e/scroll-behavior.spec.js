// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_URL || 'http://localhost:8787';

test.describe('Scroll Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('body should not scroll on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that body has overflow hidden
    const bodyOverflow = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overflow;
    });
    expect(bodyOverflow).toBe('hidden');

    // Check that body is fixed positioned
    const bodyPosition = await page.evaluate(() => {
      return window.getComputedStyle(document.body).position;
    });
    expect(bodyPosition).toBe('fixed');
  });

  test('body scroll position should remain at 0', async ({ page }) => {
    // Try to scroll the body
    await page.evaluate(() => {
      window.scrollTo(0, 100);
    });

    // Check scroll position is still 0
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });

  test('app-container should handle internal scrolling', async ({ page }) => {
    // Check app-container exists and has proper overflow
    const appContainerOverflowY = await page.evaluate(() => {
      const container = document.querySelector('.app-container');
      return container ? window.getComputedStyle(container).overflowY : null;
    });
    expect(appContainerOverflowY).toBe('auto');
  });

  test('overscroll-behavior should be none on body', async ({ page }) => {
    const overscrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.body).overscrollBehavior;
    });
    expect(overscrollBehavior).toBe('none');
  });

  test('modal should block background scrolling when open', async ({ page }) => {
    // Click create room to trigger name modal
    await page.click('#create-room-btn');

    // Wait for modal to appear
    await page.waitForSelector('#name-modal:not(.hidden)', { timeout: 2000 });

    // Check that body has modal-open class
    const hasModalOpen = await page.evaluate(() => {
      return document.body.classList.contains('modal-open');
    });
    expect(hasModalOpen).toBe(true);

    // Check that app-container has pointer-events none (via CSS)
    const appContainerPointerEvents = await page.evaluate(() => {
      const container = document.querySelector('.app-container');
      return container ? window.getComputedStyle(container).pointerEvents : null;
    });
    expect(appContainerPointerEvents).toBe('none');
  });

  test('modal should use custom design not native prompt', async ({ page }) => {
    // Click create room
    await page.click('#create-room-btn');

    // Wait for custom modal (not native prompt)
    const modal = await page.waitForSelector('#name-modal:not(.hidden)', { timeout: 2000 });
    expect(modal).toBeTruthy();

    // Check modal has the styled input
    const nameInput = await page.$('#name-input');
    expect(nameInput).toBeTruthy();

    // Check modal title
    const modalTitle = await page.textContent('#name-modal h2');
    expect(modalTitle).toContain('Enter the Darkness');
  });

  test('modal should close and restore scrolling after name entry', async ({ page }) => {
    // Click create room
    await page.click('#create-room-btn');

    // Wait for modal
    await page.waitForSelector('#name-modal:not(.hidden)', { timeout: 2000 });

    // Enter name
    await page.fill('#name-input', 'TestPlayer');

    // Submit
    await page.click('#name-submit-btn');

    // Wait for modal to close
    await page.waitForSelector('#name-modal.hidden', { timeout: 2000 });

    // Check modal-open class is removed
    const hasModalOpen = await page.evaluate(() => {
      return document.body.classList.contains('modal-open');
    });
    expect(hasModalOpen).toBe(false);
  });

  test('input should not cause viewport scroll on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Focus the room code input
    await page.focus('#room-code-input');

    // Small delay for any scroll animation
    await page.waitForTimeout(300);

    // Check body scroll is still 0
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(0);
  });
});
