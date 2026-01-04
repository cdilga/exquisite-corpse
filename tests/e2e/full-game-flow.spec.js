import { test, expect } from '@playwright/test';

/**
 * Full Game Flow E2E Tests
 * Tests complete 2-player game with configurable rounds
 */

test.describe('Full Game Flow', () => {
  test('Two players complete a game with 1 round each', async ({ browser }) => {
    // Create two browser contexts for two players
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1: Create room
      await page1.goto('/');
      await page1.waitForLoadState('networkidle');

      page1.once('dialog', dialog => dialog.accept('Alice'));
      await page1.click('#create-room-btn');

      // Wait for room code to display
      const roomCodeDisplay = page1.locator('#room-code-display');
      await expect(roomCodeDisplay).toBeVisible({ timeout: 10000 });

      const roomCode = await roomCodeDisplay.textContent();
      console.log('Created room:', roomCode);
      expect(roomCode).toMatch(/^[A-Z]{4}$/);

      // Verify lobby is displayed with start button
      await expect(page1.locator('#lobby-screen')).toBeVisible();
      await expect(page1.locator('#start-game-btn')).toBeVisible();

      // Player 2: Join room
      await page2.goto('/');
      await page2.waitForLoadState('networkidle');

      const roomInput = page2.locator('#room-code-input');
      await expect(roomInput).toBeVisible();
      await roomInput.fill(roomCode);

      page2.once('dialog', dialog => dialog.accept('Bob'));
      await page2.click('#join-room-btn');

      // Wait for both players to see each other in lobby
      await expect(page2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
      await page2.waitForTimeout(1000);

      // Verify both players appear in lists
      const page1PlayersText = await page1.locator('#players-list').textContent();
      const page2PlayersText = await page2.locator('#players-list').textContent();
      expect(page1PlayersText).toContain('Alice');
      expect(page1PlayersText).toContain('Bob');
      expect(page2PlayersText).toContain('Alice');
      expect(page2PlayersText).toContain('Bob');

      // Player 1 (host) starts the game
      await page1.click('#start-game-btn');

      // Both players should see game screen
      await expect(page1.locator('#game-screen')).toBeVisible({ timeout: 10000 });
      await expect(page2.locator('#game-screen')).toBeVisible({ timeout: 10000 });

      // Player 1 should see their turn (first sentence)
      await expect(page1.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await expect(page1.locator('#first-sentence-hint')).toBeVisible();

      // Player 2 should be waiting
      await expect(page2.locator('#waiting-turn')).toBeVisible();
      const waitingText = await page2.locator('#current-player-name').textContent();
      expect(waitingText).toBe('Alice');

      // Player 1 submits a sentence
      await page1.locator('#sentence-input').fill('The mysterious cat appeared at midnight.');
      await page1.click('#submit-sentence-btn');

      // Now Player 2 should see their turn with the previous sentence
      await expect(page2.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('#previous-sentence-container')).toBeVisible();
      const prevSentence = await page2.locator('#previous-sentence').textContent();
      expect(prevSentence).toBe('The mysterious cat appeared at midnight.');

      // Player 1 should now be waiting
      await expect(page1.locator('#waiting-turn')).toBeVisible();

      // Player 2 submits their sentence (completing the game with 2 players, 1 round each)
      await page2.locator('#sentence-input').fill('It carried secrets from another world.');
      await page2.click('#submit-sentence-btn');

      // Both players should see results screen with complete story
      await expect(page1.locator('#results-screen')).toBeVisible({ timeout: 10000 });
      await expect(page2.locator('#results-screen')).toBeVisible({ timeout: 10000 });

      // Verify story contains both sentences
      const story1 = await page1.locator('#story-container').textContent();
      const story2 = await page2.locator('#story-container').textContent();

      expect(story1).toContain('The mysterious cat appeared at midnight.');
      expect(story1).toContain('It carried secrets from another world.');
      expect(story1).toContain('Alice');
      expect(story1).toContain('Bob');

      expect(story2).toContain('The mysterious cat appeared at midnight.');
      expect(story2).toContain('It carried secrets from another world.');

      console.log('Game completed successfully!');

    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('Two players complete a game with 2 rounds each (4 total turns)', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Capture console logs
      page1.on('console', msg => console.log('Page1:', msg.text()));
      page2.on('console', msg => console.log('Page2:', msg.text()));

      // Player 1: Create room
      await page1.goto('/');
      page1.once('dialog', dialog => dialog.accept('Alice'));
      await page1.click('#create-room-btn');

      const roomCodeDisplay = page1.locator('#room-code-display');
      await expect(roomCodeDisplay).toBeVisible({ timeout: 10000 });
      const roomCode = await roomCodeDisplay.textContent();

      // Player 2: Join room
      await page2.goto('/');
      await page2.locator('#room-code-input').fill(roomCode);
      page2.once('dialog', dialog => dialog.accept('Bob'));
      await page2.click('#join-room-btn');

      await expect(page2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
      await page2.waitForTimeout(1000);

      // Host sets 2 rounds per player
      await page1.click('.rounds-btn[data-rounds="2"]');
      // Wait for the game settings to sync
      await page1.waitForTimeout(1000);

      // Verify settings update - the button should have active styling
      await expect(page1.locator('.rounds-btn[data-rounds="2"]')).toHaveClass(/bg-red-900/, { timeout: 2000 });

      // Start game
      await page1.click('#start-game-btn');

      // Round 1, Turn 1: Alice
      await expect(page1.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page1.locator('#sentence-input').fill('Sentence 1 from Alice.');
      await page1.click('#submit-sentence-btn');

      // Round 1, Turn 2: Bob
      await expect(page2.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      const prev1 = await page2.locator('#previous-sentence').textContent();
      expect(prev1).toBe('Sentence 1 from Alice.');
      await page2.locator('#sentence-input').fill('Sentence 2 from Bob.');
      await page2.click('#submit-sentence-btn');

      // Wait and check state after Bob's submission
      await page1.waitForTimeout(2000);

      // Debug: Check what screen Alice is on
      const aliceResultsVisible = await page1.locator('#results-screen').isVisible();
      const aliceYourTurnVisible = await page1.locator('#your-turn').isVisible();
      const aliceWaitingVisible = await page1.locator('#waiting-turn').isVisible();
      console.log('After turn 2 - Alice results:', aliceResultsVisible, 'your-turn:', aliceYourTurnVisible, 'waiting:', aliceWaitingVisible);

      // Round 2, Turn 3: Alice
      await expect(page1.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      const prev2 = await page1.locator('#previous-sentence').textContent();
      expect(prev2).toBe('Sentence 2 from Bob.');
      await page1.locator('#sentence-input').fill('Sentence 3 from Alice.');
      await page1.click('#submit-sentence-btn');

      // Round 2, Turn 4: Bob (final)
      await expect(page2.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      const prev3 = await page2.locator('#previous-sentence').textContent();
      expect(prev3).toBe('Sentence 3 from Alice.');
      await page2.locator('#sentence-input').fill('Sentence 4 from Bob.');
      await page2.click('#submit-sentence-btn');

      // Both should see results
      await expect(page1.locator('#results-screen')).toBeVisible({ timeout: 10000 });
      await expect(page2.locator('#results-screen')).toBeVisible({ timeout: 10000 });

      // Verify all 4 sentences appear
      const story = await page1.locator('#story-container').textContent();
      expect(story).toContain('Sentence 1 from Alice.');
      expect(story).toContain('Sentence 2 from Bob.');
      expect(story).toContain('Sentence 3 from Alice.');
      expect(story).toContain('Sentence 4 from Bob.');

      console.log('Multi-round game completed successfully!');

    } finally {
      await page1.close();
      await page2.close();
    }
  });
});

test.describe('Export and Share Functions', () => {
  test('Download story as TXT file', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Quick game setup
      await page1.goto('/');
      page1.once('dialog', dialog => dialog.accept('Alice'));
      await page1.click('#create-room-btn');

      const roomCode = await page1.locator('#room-code-display').textContent();

      await page2.goto('/');
      await page2.locator('#room-code-input').fill(roomCode);
      page2.once('dialog', dialog => dialog.accept('Bob'));
      await page2.click('#join-room-btn');

      await expect(page2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
      await page1.waitForTimeout(500);
      await page1.click('#start-game-btn');

      // Play game
      await expect(page1.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page1.locator('#sentence-input').fill('Test sentence one.');
      await page1.click('#submit-sentence-btn');

      await expect(page2.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page2.locator('#sentence-input').fill('Test sentence two.');
      await page2.click('#submit-sentence-btn');

      // Wait for results
      await expect(page1.locator('#results-screen')).toBeVisible({ timeout: 10000 });

      // Test TXT download
      const downloadPromise = page1.waitForEvent('download');
      await page1.click('#download-txt-btn');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/^exquisite-corpse-\d+\.txt$/);

    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('Download story as HTML file', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Quick game setup
      await page1.goto('/');
      page1.once('dialog', dialog => dialog.accept('Alice'));
      await page1.click('#create-room-btn');

      const roomCode = await page1.locator('#room-code-display').textContent();

      await page2.goto('/');
      await page2.locator('#room-code-input').fill(roomCode);
      page2.once('dialog', dialog => dialog.accept('Bob'));
      await page2.click('#join-room-btn');

      await expect(page2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
      await page1.waitForTimeout(500);
      await page1.click('#start-game-btn');

      // Play game
      await expect(page1.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page1.locator('#sentence-input').fill('Test sentence one.');
      await page1.click('#submit-sentence-btn');

      await expect(page2.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page2.locator('#sentence-input').fill('Test sentence two.');
      await page2.click('#submit-sentence-btn');

      // Wait for results
      await expect(page1.locator('#results-screen')).toBeVisible({ timeout: 10000 });

      // Test HTML download
      const downloadPromise = page1.waitForEvent('download');
      await page1.click('#download-html-btn');
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/^exquisite-corpse-\d+\.html$/);

    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('Generate and display share link', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Quick game setup
      await page1.goto('/');
      page1.once('dialog', dialog => dialog.accept('Alice'));
      await page1.click('#create-room-btn');

      const roomCode = await page1.locator('#room-code-display').textContent();

      await page2.goto('/');
      await page2.locator('#room-code-input').fill(roomCode);
      page2.once('dialog', dialog => dialog.accept('Bob'));
      await page2.click('#join-room-btn');

      await expect(page2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
      await page1.waitForTimeout(500);
      await page1.click('#start-game-btn');

      // Play game
      await expect(page1.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page1.locator('#sentence-input').fill('Test sentence one.');
      await page1.click('#submit-sentence-btn');

      await expect(page2.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page2.locator('#sentence-input').fill('Test sentence two.');
      await page2.click('#submit-sentence-btn');

      // Wait for results
      await expect(page1.locator('#results-screen')).toBeVisible({ timeout: 10000 });

      // Test share link generation
      await page1.click('#generate-link-btn');
      await expect(page1.locator('#share-link-result')).toBeVisible({ timeout: 30000 });

      const shareUrl = await page1.locator('#share-link-url').inputValue();
      expect(shareUrl).toContain('/story/');

    } finally {
      await page1.close();
      await page2.close();
    }
  });

  test('Copy share link to clipboard', async ({ browser }) => {
    const context1 = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Quick game setup
      await page1.goto('/');
      page1.once('dialog', dialog => dialog.accept('Alice'));
      await page1.click('#create-room-btn');

      const roomCode = await page1.locator('#room-code-display').textContent();

      await page2.goto('/');
      await page2.locator('#room-code-input').fill(roomCode);
      page2.once('dialog', dialog => dialog.accept('Bob'));
      await page2.click('#join-room-btn');

      await expect(page2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
      await page1.waitForTimeout(500);
      await page1.click('#start-game-btn');

      // Play game
      await expect(page1.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page1.locator('#sentence-input').fill('Test sentence one.');
      await page1.click('#submit-sentence-btn');

      await expect(page2.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page2.locator('#sentence-input').fill('Test sentence two.');
      await page2.click('#submit-sentence-btn');

      // Wait for results
      await expect(page1.locator('#results-screen')).toBeVisible({ timeout: 10000 });

      // Generate and copy share link
      await page1.click('#generate-link-btn');
      await expect(page1.locator('#share-link-result')).toBeVisible({ timeout: 30000 });
      await page1.click('#copy-share-link-btn');

      // Note: clipboard testing in headless browsers is tricky
      // The click should succeed without error

    } finally {
      await page1.close();
      await page2.close();
    }
  });
});

test.describe('TTS Playback', () => {
  test('TTS play button is visible after game completion', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Quick game setup
      await page1.goto('/');
      page1.once('dialog', dialog => dialog.accept('Alice'));
      await page1.click('#create-room-btn');

      const roomCode = await page1.locator('#room-code-display').textContent();

      await page2.goto('/');
      await page2.locator('#room-code-input').fill(roomCode);
      page2.once('dialog', dialog => dialog.accept('Bob'));
      await page2.click('#join-room-btn');

      await expect(page2.locator('#lobby-screen')).toBeVisible({ timeout: 10000 });
      await page1.waitForTimeout(500);
      await page1.click('#start-game-btn');

      // Play game
      await expect(page1.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page1.locator('#sentence-input').fill('Test sentence one.');
      await page1.click('#submit-sentence-btn');

      await expect(page2.locator('#your-turn')).toBeVisible({ timeout: 5000 });
      await page2.locator('#sentence-input').fill('Test sentence two.');
      await page2.click('#submit-sentence-btn');

      // Wait for results
      await expect(page1.locator('#results-screen')).toBeVisible({ timeout: 10000 });

      // Verify TTS controls are visible
      await expect(page1.locator('#play-audio-btn')).toBeVisible();
      await expect(page1.locator('#voice-selector')).toBeVisible();

    } finally {
      await page1.close();
      await page2.close();
    }
  });
});
