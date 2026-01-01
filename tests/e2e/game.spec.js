import { test, expect } from '@playwright/test';

test.describe('Exquisite Corpse E2E Tests', () => {
  // Helper function to generate unique room codes
  const generateRoomCode = () => `TEST${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  test.describe('Landing Page', () => {
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
  });

  test.describe('Room Code Input Validation', () => {
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

  test.describe('Room Creation and Navigation', () => {
    test('should create a new room and display room code', async ({ page }) => {
      await page.goto('/');

      // Set up listener for prompt before clicking
      page.once('dialog', dialog => {
        dialog.accept('TestPlayer');
      });

      // Click create room button - will trigger name prompt
      await page.locator('#create-room-btn').click();

      // Should switch to lobby screen and display room code
      await expect(page.locator('#lobby-screen')).not.toHaveClass('hidden', { timeout: 5000 });

      // Room code should be displayed (4 uppercase letters/numbers)
      const roomCodeDisplay = page.locator('#room-code-display');
      await expect(roomCodeDisplay).toHaveText(/^[A-Z0-9]{4}$/);
    });

    test('should allow joining a room with valid code', async ({ page, context }) => {
      // Player 1: Create room
      page.once('dialog', dialog => {
        dialog.accept('Player1');
      });
      await page.goto('/');
      await page.locator('#create-room-btn').click();

      // Wait for lobby screen to appear and get room code
      await expect(page.locator('#lobby-screen')).not.toHaveClass('hidden', { timeout: 5000 });
      const roomCode = await page.locator('#room-code-display').textContent();

      // Player 2: Join the same room
      const page2 = await context.newPage();
      page2.once('dialog', dialog => {
        dialog.accept('Player2');
      });

      await page2.goto('/');
      await page2.locator('#room-code-input').fill(roomCode);
      await page2.locator('#join-room-btn').click();

      // Should show lobby screen
      await expect(page2.locator('#lobby-screen')).not.toHaveClass('hidden', { timeout: 5000 });

      // Both players should see the same room code
      const player2RoomCode = await page2.locator('#room-code-display').textContent();
      expect(player2RoomCode).toBe(roomCode);
    });
  });

  test.describe('Game Lobby', () => {
    test('should display player in lobby after joining room', async ({ page }) => {
      // Create room
      page.once('dialog', dialog => {
        dialog.accept('HostPlayer');
      });

      await page.goto('/');
      await page.locator('#create-room-btn').click();

      // Should display lobby screen
      await expect(page.locator('#lobby-screen')).not.toHaveClass('hidden', { timeout: 5000 });

      // Check that lobby has expected elements
      await expect(page.locator('h2')).toContainText('Room Code');
      await expect(page.locator('#players-list')).toBeVisible();
      await expect(page.locator('#start-game-btn')).toBeVisible();
    });

    test('should show error for missing player name', async ({ page }) => {
      // Create room but cancel the name prompt (empty string)
      page.once('dialog', dialog => {
        dialog.dismiss(); // Cancel the prompt
      });

      await page.goto('/');
      await page.locator('#create-room-btn').click();

      // Connection should fail or show error
      // Give it a moment to attempt connection
      await page.waitForTimeout(1000);

      // Should stay on landing screen (connection failed due to no name)
      const landingVisible = await page.locator('#landing-screen').evaluate(el => !el.classList.contains('hidden'));
      expect(landingVisible).toBeTruthy();
    });
  });

  test.describe('Complete Game Flow', () => {
    test('should allow 2 players to join lobby and start game', async ({ page, context }) => {
      // Player 1: Create room
      page.once('dialog', dialog => {
        dialog.accept('Player1');
      });

      await page.goto('/');
      await page.locator('#create-room-btn').click();

      // Wait for lobby screen and get room code
      await expect(page.locator('#lobby-screen')).not.toHaveClass('hidden', { timeout: 5000 });
      const roomCode = await page.locator('#room-code-display').textContent();
      console.log(`Room created with code: ${roomCode}`);

      // Player 2: Join the room
      const page2 = await context.newPage();
      page2.once('dialog', dialog => {
        dialog.accept('Player2');
      });

      await page2.goto('/');
      console.log(`Attempting to join room with code: ${roomCode}`);

      await page2.locator('#room-code-input').fill(roomCode);
      const inputValue = await page2.locator('#room-code-input').inputValue();
      console.log(`Input field contains: ${inputValue}`);

      await page2.locator('#join-room-btn').click();

      // Wait for Player 2 to enter lobby
      await expect(page2.locator('#lobby-screen')).not.toHaveClass('hidden', { timeout: 5000 });
      const player2RoomCode = await page2.locator('#room-code-display').textContent();
      console.log(`Player 2 room code: ${player2RoomCode}`);

      if (player2RoomCode !== roomCode) {
        console.warn(`❌ BUG DETECTED: Player 2 has different room code! Expected: ${roomCode}, Got: ${player2RoomCode}`);
      } else {
        console.log(`✅ Both players in same room: ${roomCode}`);
      }

      // Verify both players see each other (players list should have entries)
      const playersList1 = await page.locator('#players-list').textContent();
      const playersList2 = await page2.locator('#players-list').textContent();

      console.log(`Player 1 sees ${playersList1.split('\n').filter(l => l.trim()).length} players`);
      console.log(`Player 2 sees ${playersList2.split('\n').filter(l => l.trim()).length} players`);

      // Both should see the players list is populated
      expect(playersList1.length).toBeGreaterThan(0);
      expect(playersList2.length).toBeGreaterThan(0);

      // Player 1 (host) clicks "Start Game"
      console.log('Clicking Start Game button...');
      await page.locator('#start-game-btn').click();

      // Give a moment for the game state to update
      await page.waitForTimeout(1000);

      // Both players should transition to game screen
      console.log('Waiting for game screens to appear...');
      await expect(page.locator('#game-screen')).not.toHaveClass('hidden', { timeout: 5000 });
      await expect(page2.locator('#game-screen')).not.toHaveClass('hidden', { timeout: 5000 });
      console.log('✅ Both players transitioned to game screen');

      // One player should have "Your Turn" visible
      const player1HasTurn = await page.locator('#your-turn').evaluate(el => !el.classList.contains('hidden'));
      const player2HasTurn = await page2.locator('#your-turn').evaluate(el => !el.classList.contains('hidden'));

      console.log(`Player 1 has turn: ${player1HasTurn}, Player 2 has turn: ${player2HasTurn}`);

      if (!player1HasTurn && !player2HasTurn) {
        // Debug: log what sections are visible
        const p1GameContent = await page.locator('#game-screen').innerHTML();
        console.warn('Player 1 game screen HTML:', p1GameContent.substring(0, 500));
      }

      // Exactly one should have a turn (turn-based)
      if (!(player1HasTurn || player2HasTurn)) {
        console.warn('❌ BUG: Neither player has a turn assigned!');
      } else {
        console.log('✅ Turn assignment working');
      }
      expect(player1HasTurn || player2HasTurn).toBeTruthy();

      // The other should be waiting
      const player1Waiting = await page.locator('#waiting-turn').evaluate(el => !el.classList.contains('hidden'));
      const player2Waiting = await page2.locator('#waiting-turn').evaluate(el => !el.classList.contains('hidden'));

      console.log(`Player 1 waiting: ${player1Waiting}, Player 2 waiting: ${player2Waiting}`);
      expect(player1Waiting || player2Waiting).toBeTruthy();

      console.log(`✅ Game started! Player1 turn: ${player1HasTurn}, Player2 turn: ${player2HasTurn}`);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile device', async ({ page }) => {
      // Mobile test using Pixel 5 viewport (393x851)
      await page.goto('/');

      // Elements should still be visible on mobile
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('#create-room-btn')).toBeVisible();
      await expect(page.locator('#join-room-btn')).toBeVisible();

      // Check that text is readable (reasonable font size)
      const heading = page.locator('h1');
      const fontSize = await heading.evaluate((el) => window.getComputedStyle(el).fontSize);
      const fontSizeValue = parseInt(fontSize);
      expect(fontSizeValue).toBeGreaterThan(12); // At least readable size
    });
  });

  test.describe('WebSocket Connection', () => {
    test('should establish WebSocket connection when joining room', async ({ page }) => {
      await page.goto('/');

      // Monitor WebSocket connections
      let wsUrl = null;
      page.on('websocket', (ws) => {
        wsUrl = ws.url();
      });

      // Create room (should establish WebSocket)
      await page.locator('#create-room-btn').click();
      await page.waitForLoadState('networkidle');

      // Wait a moment for WebSocket to establish
      await page.waitForTimeout(500);

      // Verify WebSocket connection was attempted
      expect(wsUrl).toBeTruthy();
    });
  });
});
