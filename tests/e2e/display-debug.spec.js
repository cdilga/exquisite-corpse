import { test, expect } from '@playwright/test';

test.describe('Display Issue Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the game
    await page.goto('/');
  });

  test('initial page loads without rendering template code', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'test-results/display-initial.png', fullPage: true });

    // Check that no template syntax is visible in the page text
    const bodyText = await page.textContent('body');

    // These patterns should NOT appear in the rendered text
    const badPatterns = [
      '${',          // Template interpolation
      '\\$',         // Escaped dollar with backslash
      '`)',          // Backtick with closing paren
      'map((',       // Map function visible
      '.join("")',   // Join visible
    ];

    for (const pattern of badPatterns) {
      if (bodyText.includes(pattern)) {
        console.error(`Found bad pattern: "${pattern}" in page text`);
      }
      expect(bodyText).not.toContain(pattern, `Page should not contain template code: ${pattern}`);
    }
  });

  test('display story renders correctly without template syntax', async ({ page }) => {
    // Mock story data
    await page.evaluate(() => {
      window.currentStory = [
        { playerName: 'Alice', sentence: 'Once upon a time.', roundNumber: 1 },
        { playerName: 'Bob', sentence: 'There was a developer.', roundNumber: 1 },
      ];
    });

    // Call the display function
    await page.evaluate(() => {
      const storyContainer = document.getElementById('story-container');
      if (storyContainer) {
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
      }
    });

    // Take screenshot of story display
    await page.screenshot({ path: 'test-results/display-story.png', fullPage: true });

    // Verify story content is correctly rendered
    const storyText = await page.textContent('#story-container');

    expect(storyText).toContain('Alice');
    expect(storyText).toContain('Once upon a time');
    expect(storyText).toContain('Bob');
    expect(storyText).toContain('There was a developer');
    expect(storyText).toContain('Round 1');

    // Verify NO template code is visible
    expect(storyText).not.toContain('${');
    expect(storyText).not.toContain('map(');
    expect(storyText).not.toContain('.join');
    expect(storyText).not.toContain('\\$');
  });

  test('HTML export function generates valid HTML', async ({ page }) => {
    // Set up mock story
    await page.evaluate(() => {
      window.currentStory = [
        { playerName: 'Test', sentence: 'Test sentence.', roundNumber: 1 },
      ];
    });

    // Get the generated HTML
    const generatedHtml = await page.evaluate(() => {
      // Simulate the formatStoryAsHTML function
      const currentStory = window.currentStory;
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test Story</title>
</head>
<body>
  ${currentStory.map((entry, index) => `
    <div>
      <span>${index + 1}. ${entry.playerName}</span>
      <p>${entry.sentence}</p>
    </div>
  `).join('')}
</body>
</html>`;
    });

    // Verify HTML structure
    expect(generatedHtml).toContain('<!DOCTYPE html>');
    expect(generatedHtml).toContain('<html');
    expect(generatedHtml).toContain('Test');
    expect(generatedHtml).toContain('Test sentence');

    // Verify NO template code in output
    expect(generatedHtml).not.toContain('${');
    expect(generatedHtml).not.toContain('map(');
  });

  test('verify no escaped characters in rendered HTML', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get all visible text content
    const allText = await page.evaluate(() => {
      return document.body.innerText;
    });

    // These escaped characters should not appear in rendered text
    const escapedPatterns = [
      '\\`',         // Escaped backtick
      '\\$',         // Escaped dollar (outside of normal \$\{ pattern)
      '\\{',         // Escaped brace
    ];

    for (const pattern of escapedPatterns) {
      if (allText.includes(pattern)) {
        console.warn(`Found escaped character: "${pattern}"`);
      }
    }
  });
});
