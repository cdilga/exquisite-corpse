import { test, expect, Page } from '@playwright/test';

/**
 * Full Game Flow E2E Tests
 * Tests: A) Game Flow (turn order, submission), B) Story Reveal, C) Export Functionality
 */

test.describe('Full Game Flow - A, B, C', () => {
  let page1, page2, roomCode;

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts for two players
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    page1 = await context1.newPage();
    page2 = await context2.newPage();
  });

  test.afterEach(async () => {
    await page1.close();
    await page2.close();
  });

  test('A1: Player 1 creates room and sees it ready for game', async () => {
    await page1.goto('http://localhost:8787');
    await page1.waitForLoadState('networkidle');

    // Create room as Player 1
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    // Wait for room code to display
    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });

    roomCode = await roomCodeDisplay.textContent();
    console.log('Created room:', roomCode);

    // Verify room code format
    expect(roomCode).toMatch(/^[A-Z]{4}$/);

    // Verify lobby is displayed
    const lobbyScreen = page1.locator('#lobby-screen');
    await expect(lobbyScreen).toBeVisible();

    // Verify start game button is visible (host privilege)
    const startButton = page1.locator('#start-game-btn');
    await expect(startButton).toBeVisible();
  });

  test('A2: Player 2 joins the room with room code', async () => {
    // Player 1: Create room
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    // Player 2: Join room
    await page2.goto('http://localhost:8787');
    await page2.waitForLoadState('networkidle');

    // Find and fill room code input
    const roomInput = page2.locator('#join-room-input');
    await expect(roomInput).toBeVisible();
    await roomInput.fill(roomCode);

    // Set player name
    page2.once('dialog', dialog => dialog.accept('Player Two'));
    await page2.click('#join-room-btn');

    // Wait for lobby to appear on page2
    const lobbyScreen = page2.locator('#lobby-screen');
    await expect(lobbyScreen).toBeVisible({ timeout: 5000 });

    // Wait a moment for player list to update
    await page2.waitForTimeout(500);

    // Verify both players appear in each player's list
    const page1PlayersList = page1.locator('#players-list');
    const page2PlayersList = page2.locator('#players-list');

    const page1PlayersText = await page1PlayersList.textContent();
    const page2PlayersText = await page2PlayersList.textContent();

    expect(page1PlayersText).toContain('Player One');
    expect(page1PlayersText).toContain('Player Two');
    expect(page2PlayersText).toContain('Player One');
    expect(page2PlayersText).toContain('Player Two');
  });

  test('A3: Game starts and player 1 receives their turn', async () => {
    // Setup: Player 1 creates, Player 2 joins
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    await page2.goto('http://localhost:8787');
    const roomInput = page2.locator('#join-room-input');
    await roomInput.fill(roomCode);
    page2.once('dialog', dialog => dialog.accept('Player Two'));
    await page2.click('#join-room-btn');
    await page2.locator('#lobby-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Wait for stable state
    await page1.waitForTimeout(1000);

    // Player 1 (host) starts the game
    const startButton = page1.locator('#start-game-btn');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Both players should see game screen
    const gameScreen1 = page1.locator('#game-screen');
    const gameScreen2 = page2.locator('#game-screen');

    await expect(gameScreen1).toBeVisible({ timeout: 5000 });
    await expect(gameScreen2).toBeVisible({ timeout: 5000 });

    // Player 1 should see their turn
    const turnDisplay1 = page1.locator('#turn-display');
    const turnText1 = await turnDisplay1.textContent();
    expect(turnText1).toContain('Your Turn');

    // Player 2 should see waiting screen
    const waitingText = await page2.locator('#waiting-for').textContent();
    expect(waitingText).toContain('Player One');
  });

  test('A4: Player 1 submits sentence, Player 2 gets turn with only previous sentence', async () => {
    // Setup: Create room, player 2 joins, start game
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    await page2.goto('http://localhost:8787');
    const roomInput = page2.locator('#join-room-input');
    await roomInput.fill(roomCode);
    page2.once('dialog', dialog => dialog.accept('Player Two'));
    await page2.click('#join-room-btn');
    await page2.locator('#lobby-screen').waitFor({ state: 'visible', timeout: 5000 });

    await page1.waitForTimeout(1000);
    await page1.click('#start-game-btn');

    await page1.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });
    await page2.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Player 1 submits a sentence
    const sentenceInput = page1.locator('#sentence-input');
    const submitButton = page1.locator('#submit-sentence-btn');

    await sentenceInput.fill('The cat sat on the mat.');
    await submitButton.click();

    // Player 1 should now be waiting
    await page1.waitForTimeout(500);
    const p1WaitingText = await page1.locator('#waiting-for').textContent();
    expect(p1WaitingText).toContain('Player Two');

    // Player 2 should now see their turn
    await page2.waitForTimeout(500);
    const p2TurnText = await page2.locator('#turn-display').textContent();
    expect(p2TurnText).toContain('Your Turn');

    // Player 2 should see ONLY the previous sentence (not the full story)
    const contextDisplay = page2.locator('#previous-sentence');
    const contextText = await contextDisplay.textContent();
    expect(contextText).toContain('The cat sat on the mat.');

    // Verify Player 2's sentence input is visible
    const p2Input = page2.locator('#sentence-input');
    await expect(p2Input).toBeVisible();
  });

  test('B1: Story completes and shows story_complete on results screen', async () => {
    // Setup with 2 players
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    await page2.goto('http://localhost:8787');
    const roomInput = page2.locator('#join-room-input');
    await roomInput.fill(roomCode);
    page2.once('dialog', dialog => dialog.accept('Player Two'));
    await page2.click('#join-room-btn');
    await page2.locator('#lobby-screen').waitFor({ state: 'visible', timeout: 5000 });

    await page1.waitForTimeout(1000);
    await page1.click('#start-game-btn');

    await page1.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });
    await page2.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Player 1 submits
    await page1.locator('#sentence-input').fill('The mysterious door opened slowly.');
    await page1.locator('#submit-sentence-btn').click();

    await page2.waitForTimeout(500);

    // Player 2 submits (this completes the game since we have 2 players, 1 round each)
    await page2.locator('#sentence-input').fill('Inside was a garden of dancing flowers.');
    await page2.locator('#submit-sentence-btn').click();

    // Both should see results screen
    const resultsScreen1 = page1.locator('#results-screen');
    const resultsScreen2 = page2.locator('#results-screen');

    await expect(resultsScreen1).toBeVisible({ timeout: 5000 });
    await expect(resultsScreen2).toBeVisible({ timeout: 5000 });

    // Verify game screen is hidden
    const gameScreen1 = page1.locator('#game-screen');
    await expect(gameScreen1).not.toBeVisible();
  });

  test('B2: Story displays with all sentences and author names on results', async () => {
    // Setup and play game
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Alice'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    await page2.goto('http://localhost:8787');
    const roomInput = page2.locator('#join-room-input');
    await roomInput.fill(roomCode);
    page2.once('dialog', dialog => dialog.accept('Bob'));
    await page2.click('#join-room-btn');
    await page2.locator('#lobby-screen').waitFor({ state: 'visible', timeout: 5000 });

    await page1.waitForTimeout(1000);
    await page1.click('#start-game-btn');

    await page1.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });
    await page2.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Player 1 (Alice) submits
    const sentence1 = 'Once upon a time, there lived a dragon.';
    await page1.locator('#sentence-input').fill(sentence1);
    await page1.locator('#submit-sentence-btn').click();

    await page2.waitForTimeout(500);

    // Player 2 (Bob) submits
    const sentence2 = 'The dragon loved to eat cheese and crackers.';
    await page2.locator('#sentence-input').fill(sentence2);
    await page2.locator('#submit-sentence-btn').click();

    // Wait for results screen
    await page1.locator('#results-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Check story display
    const storyDisplay = page1.locator('#story-display');
    const storyText = await storyDisplay.textContent();

    // Verify both sentences appear
    expect(storyText).toContain(sentence1);
    expect(storyText).toContain(sentence2);

    // Verify author names appear
    expect(storyText).toContain('Alice');
    expect(storyText).toContain('Bob');
  });

  test('C1: Download story as TXT file', async () => {
    // Setup and play game to completion
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    await page2.goto('http://localhost:8787');
    const roomInput = page2.locator('#join-room-input');
    await roomInput.fill(roomCode);
    page2.once('dialog', dialog => dialog.accept('Player Two'));
    await page2.click('#join-room-btn');
    await page2.locator('#lobby-screen').waitFor({ state: 'visible', timeout: 5000 });

    await page1.waitForTimeout(1000);
    await page1.click('#start-game-btn');

    await page1.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });
    await page2.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Submit sentences
    await page1.locator('#sentence-input').fill('The adventure begins.');
    await page1.locator('#submit-sentence-btn').click();

    await page2.waitForTimeout(500);

    await page2.locator('#sentence-input').fill('But nobody expected what came next.');
    await page2.locator('#submit-sentence-btn').click();

    // Wait for results
    await page1.locator('#results-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Click download TXT button
    const downloadTxtBtn = page1.locator('#download-txt-btn');
    await expect(downloadTxtBtn).toBeVisible();

    // Listen for download
    const downloadPromise = page1.waitForEvent('download');
    await downloadTxtBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^exquisite-corpse-\d+\.txt$/);

    console.log('TXT file downloaded:', download.suggestedFilename());
  });

  test('C2: Download story as HTML file', async () => {
    // Setup and play game
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    await page2.goto('http://localhost:8787');
    const roomInput = page2.locator('#join-room-input');
    await roomInput.fill(roomCode);
    page2.once('dialog', dialog => dialog.accept('Player Two'));
    await page2.click('#join-room-btn');
    await page2.locator('#lobby-screen').waitFor({ state: 'visible', timeout: 5000 });

    await page1.waitForTimeout(1000);
    await page1.click('#start-game-btn');

    await page1.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });
    await page2.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Submit sentences
    await page1.locator('#sentence-input').fill('The adventure begins.');
    await page1.locator('#submit-sentence-btn').click();

    await page2.waitForTimeout(500);

    await page2.locator('#sentence-input').fill('But nobody expected what came next.');
    await page2.locator('#submit-sentence-btn').click();

    // Wait for results
    await page1.locator('#results-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Click download HTML button
    const downloadHtmlBtn = page1.locator('#download-html-btn');
    await expect(downloadHtmlBtn).toBeVisible();

    // Listen for download
    const downloadPromise = page1.waitForEvent('download');
    await downloadHtmlBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^exquisite-corpse-\d+\.html$/);

    console.log('HTML file downloaded:', download.suggestedFilename());
  });

  test('C3: Generate and copy share link', async () => {
    // Setup and play game
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    await page2.goto('http://localhost:8787');
    const roomInput = page2.locator('#join-room-input');
    await roomInput.fill(roomCode);
    page2.once('dialog', dialog => dialog.accept('Player Two'));
    await page2.click('#join-room-btn');
    await page2.locator('#lobby-screen').waitFor({ state: 'visible', timeout: 5000 });

    await page1.waitForTimeout(1000);
    await page1.click('#start-game-btn');

    await page1.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });
    await page2.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Submit sentences
    await page1.locator('#sentence-input').fill('The adventure begins.');
    await page1.locator('#submit-sentence-btn').click();

    await page2.waitForTimeout(500);

    await page2.locator('#sentence-input').fill('But nobody expected what came next.');
    await page2.locator('#submit-sentence-btn').click();

    // Wait for results
    await page1.locator('#results-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Click generate link button
    const generateLinkBtn = page1.locator('#generate-link-btn');
    await expect(generateLinkBtn).toBeVisible();
    await generateLinkBtn.click();

    // Wait for share link result to appear
    const shareLinkResult = page1.locator('#share-link-result');
    await expect(shareLinkResult).toBeVisible({ timeout: 5000 });

    // Check that URL field contains a valid link
    const shareLinkUrl = page1.locator('#share-link-url');
    const urlValue = await shareLinkUrl.inputValue();

    expect(urlValue).toContain('/story/');
    expect(urlValue).toMatch(/^http/);

    console.log('Share link generated:', urlValue);
  });

  test('C4: Copy share link to clipboard', async () => {
    // Setup and play game
    await page1.goto('http://localhost:8787');
    page1.once('dialog', dialog => dialog.accept('Player One'));
    await page1.click('#create-room-btn');

    const roomCodeDisplay = page1.locator('#room-code-display');
    await expect(roomCodeDisplay).toBeVisible({ timeout: 5000 });
    roomCode = await roomCodeDisplay.textContent();

    await page2.goto('http://localhost:8787');
    const roomInput = page2.locator('#join-room-input');
    await roomInput.fill(roomCode);
    page2.once('dialog', dialog => dialog.accept('Player Two'));
    await page2.click('#join-room-btn');
    await page2.locator('#lobby-screen').waitFor({ state: 'visible', timeout: 5000 });

    await page1.waitForTimeout(1000);
    await page1.click('#start-game-btn');

    await page1.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });
    await page2.locator('#game-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Submit sentences
    await page1.locator('#sentence-input').fill('The adventure begins.');
    await page1.locator('#submit-sentence-btn').click();

    await page2.waitForTimeout(500);

    await page2.locator('#sentence-input').fill('But nobody expected what came next.');
    await page2.locator('#submit-sentence-btn').click();

    // Wait for results
    await page1.locator('#results-screen').waitFor({ state: 'visible', timeout: 5000 });

    // Generate link
    await page1.locator('#generate-link-btn').click();
    await page1.locator('#share-link-result').waitFor({ state: 'visible', timeout: 5000 });

    // Copy to clipboard
    const copyBtn = page1.locator('#copy-link-btn');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    // Verify button shows confirmation
    const buttonText = await copyBtn.textContent();
    expect(buttonText).toContain('Copied');

    console.log('Share link copied to clipboard');
  });
});
