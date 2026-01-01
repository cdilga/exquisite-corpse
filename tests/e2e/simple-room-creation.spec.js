import { test, expect } from '@playwright/test';

test('simple room creation flow', async ({ page }) => {
  await page.goto('http://localhost:8787');
  await page.waitForLoadState('networkidle');
  
  // Log when dialog appears
  page.on('dialog', async dialog => {
    console.log('Dialog appeared:', dialog.message());
    await dialog.accept('Test Player');
  });
  
  // Click create room button
  await page.click('#create-room-btn');
  
  // Wait a moment for the dialog and JavaScript to process
  await page.waitForTimeout(1000);
  
  // Check if lobby screen became visible
  const lobbyVisible = await page.locator('#lobby-screen').isVisible();
  console.log('Lobby visible:', lobbyVisible);
  
  // Check room code display
  const roomCodeText = await page.locator('#room-code-display').textContent();
  console.log('Room code:', roomCodeText);
  
  expect(lobbyVisible).toBe(true);
  expect(roomCodeText).toMatch(/^[A-Z]{4}$/);
});
