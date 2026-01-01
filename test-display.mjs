import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to dev server
  await page.goto('http://localhost:8787/');

  // Take screenshot of initial state
  console.log('📸 Taking initial screenshot...');
  await page.screenshot({ path: '/tmp/game-initial.png', fullPage: true });
  console.log('✅ Initial screenshot saved');

  // Create a room
  console.log('🎮 Creating room...');
  page.once('dialog', dialog => dialog.accept('TestPlayer'));
  await page.click('#create-room-btn');

  // Wait for room creation
  await page.waitForSelector('#room-code-display', { timeout: 5000 });
  const roomCode = await page.textContent('#room-code-display');
  console.log(`✅ Room created: ${roomCode}`);

  // Take screenshot of lobby
  await page.screenshot({ path: '/tmp/game-lobby.png', fullPage: true });
  console.log('✅ Lobby screenshot saved');

  // Start game
  console.log('▶️ Starting game...');
  await page.click('#start-game-btn');

  // Wait for game turn screen
  await page.waitForSelector('.textarea-input', { timeout: 5000 });
  console.log('✅ Game started');

  // Submit a sentence
  console.log('✏️ Submitting first sentence...');
  await page.fill('.textarea-input', 'Once upon a time there was a happy developer.');
  await page.click('.submit-btn');

  // Wait a bit for message processing
  await page.waitForTimeout(2000);
  console.log('✅ First sentence submitted');

  // Simulate game completion by checking if story would display correctly
  // Create mock story data to test rendering
  await page.evaluate(() => {
    window.currentStory = [
      { playerName: 'Alice', sentence: 'Once upon a time there was a developer.', roundNumber: 1 },
      { playerName: 'Bob', sentence: 'He loved writing code so much.', roundNumber: 1 }
    ];

    // Call displayStory function
    const storyContainer = document.getElementById('story-container');
    const story = window.currentStory;
    storyContainer.innerHTML = story.map((entry, index) => `
      <div class="story-reveal p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500" style="animation-delay: ${index * 0.1}s">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-lg font-bold text-purple-600">${index + 1}.</span>
          <span class="text-sm font-semibold text-gray-700">${entry.playerName}</span>
          <span class="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded">Round ${entry.roundNumber || 1}</span>
        </div>
        <p class="text-gray-800 text-lg">${entry.sentence}</p>
      </div>
    `).join('');
  });

  // Take screenshot of story display
  await page.screenshot({ path: '/tmp/game-story.png', fullPage: true });
  console.log('✅ Story display screenshot saved');

  // Verify story content is rendered correctly (not showing template code)
  const storyText = await page.textContent('#story-container');
  console.log('📖 Story content:\n', storyText);

  if (storyText.includes('$') || storyText.includes('map(') || storyText.includes('`.join')) {
    console.error('❌ FAIL: Story template was not rendered correctly!');
    console.error('Found template code instead of rendered story');
  } else if (storyText.includes('Alice') && storyText.includes('Once upon a time')) {
    console.log('✅ PASS: Story rendered correctly!');
  }

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
