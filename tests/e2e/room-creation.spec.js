import { test, expect } from '@playwright/test';

test.describe('Room Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8787');
    await page.waitForLoadState('networkidle');
  });

  test('create room button exists and is clickable', async ({ page }) => {
    const createButton = page.locator('#create-room-btn');
    await expect(createButton).toBeVisible();
    await expect(createButton).toContainText('Create');
  });

  test('clicking create room triggers player name dialog', async ({ page }) => {
    // Set up dialog handler BEFORE clicking
    let dialogReceived = false;
    page.on('dialog', dialog => {
      console.log('Dialog received:', dialog.message());
      dialogReceived = true;
      dialog.accept('TestPlayer');
    });

    // Click the button
    await page.click('#create-room-btn');

    // Wait a bit for dialog
    await page.waitForTimeout(500);

    // Dialog should have been triggered
    expect(dialogReceived).toBe(true);
  });

  test('room code is displayed after creation', async ({ page }) => {
    // Handle dialog
    page.once('dialog', dialog => dialog.accept('TestPlayer'));

    // Create room
    await page.click('#create-room-btn');

    // Wait for room code to appear
    const roomCodeDisplay = page.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });

    const roomCode = await roomCodeDisplay.textContent();
    console.log('Room code:', roomCode);

    // Room code should be 4 uppercase letters
    expect(roomCode).toMatch(/^[A-Z]{4}$/);
  });

  test('lobby screen shows after room creation', async ({ page }) => {
    // Handle dialog
    page.once('dialog', dialog => dialog.accept('TestPlayer'));

    // Create room
    await page.click('#create-room-btn');

    // Wait for lobby screen
    const lobbyScreen = page.locator('#lobby-screen');
    await expect(lobbyScreen).toBeVisible({ timeout: 5000 });

    // Landing screen should be hidden
    const landingScreen = page.locator('#landing-screen');
    await expect(landingScreen).not.toBeVisible();
  });

  test('player name appears in player list', async ({ page }) => {
    // Handle dialog
    page.once('dialog', dialog => dialog.accept('MyTestPlayer'));

    // Create room
    await page.click('#create-room-btn');

    // Wait for player to appear in list
    await page.waitForTimeout(500);

    const playersList = page.locator('#players-list');
    const playerText = await playersList.textContent();
    console.log('Players list:', playerText);

    expect(playerText).toContain('MyTestPlayer');
  });

  test('start game button appears for host', async ({ page }) => {
    // Handle dialog
    page.once('dialog', dialog => dialog.accept('TestHost'));

    // Create room
    await page.click('#create-room-btn');

    // Wait for start button
    const startButton = page.locator('#start-game-btn');
    await expect(startButton).toBeVisible({ timeout: 5000 });
    await expect(startButton).toContainText('Start Game');
  });

  test('WebSocket connection is established', async ({ page }) => {
    // Listen for WebSocket messages
    let wsConnected = false;

    page.evaluate(() => {
      window.wsMessageLog = [];
      // We'll check if ws is initialized
      setInterval(() => {
        if (window.ws && window.ws.readyState === 1) {
          window.wsConnected = true;
        }
      }, 100);
    });

    // Handle dialog
    page.once('dialog', dialog => dialog.accept('TestPlayer'));

    // Create room
    await page.click('#create-room-btn');

    // Wait for WebSocket connection
    await page.waitForTimeout(2000);

    // Check if WebSocket is connected
    wsConnected = await page.evaluate(() => window.wsConnected);
    console.log('WebSocket connected:', wsConnected);

    // Should be connected
    expect(wsConnected).toBe(true);
  });
});
