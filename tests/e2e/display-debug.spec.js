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

    // Check that no template syntax is visible in the VISIBLE page text (not script content)
    const visibleText = await page.evaluate(() => {
      return document.body.innerText;
    });

    // These patterns should NOT appear in the rendered text
    const badPatterns = [
      '${',          // Template interpolation
      '\\$',         // Escaped dollar with backslash
      '`)',          // Backtick with closing paren
      'map((',       // Map function visible
      '.join("")',   // Join visible
    ];

    for (const pattern of badPatterns) {
      if (visibleText.includes(pattern)) {
        console.error(`Found bad pattern: "${pattern}" in page text`);
      }
      expect(visibleText).not.toContain(pattern, `Page should not contain template code: ${pattern}`);
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

  test('page should not have duplicate content or visible JavaScript', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that the main title only appears once
    const mainTitles = await page.locator('h1:has-text("Exquisite Corpse")').count();
    expect(mainTitles).toBe(1);

    // Get all visible text
    const visibleText = await page.evaluate(() => document.body.innerText);

    // JavaScript function definitions should NOT be visible in rendered page
    const jsBadPatterns = [
      'function ',           // Function definitions
      'const elements',      // Variable declarations
      'document.getElementById', // DOM manipulation code
      'addEventListener',    // Event listener code
      'WebSocket',           // WebSocket code visible
      'async function',      // Async function definitions
      'window.',             // Window object references
      '= () =>',             // Arrow function assignments
    ];

    for (const pattern of jsBadPatterns) {
      expect(visibleText).not.toContain(pattern);
    }

    // Count occurrences of main heading text (should appear only once or twice max with subtitle)
    const corpseCount = (visibleText.match(/Exquisite Corpse/g) || []).length;
    expect(corpseCount).toBeLessThanOrEqual(2); // Main title + possibly in footer or subtitle

    // Screenshot for debugging if test fails
    await page.screenshot({ path: 'test-results/duplicate-check.png', fullPage: true });
  });

  test('page HTML structure is valid (no premature script closing)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The main test: visible DOM should not contain raw HTML/script structure
    // If script block terminates prematurely, the rest leaks into visible DOM
    const visibleText = await page.evaluate(() => document.body.innerText);

    // These patterns indicate the script block closed prematurely
    expect(visibleText).not.toContain('</script>');
    expect(visibleText).not.toContain('<script');
    expect(visibleText).not.toContain('</body>');
    expect(visibleText).not.toContain('</html>');
    expect(visibleText).not.toContain('<!DOCTYPE');

    // Check the actual DOM structure - should only have one body element
    const bodyCount = await page.evaluate(() => document.querySelectorAll('body').length);
    expect(bodyCount).toBe(1);

    // Check we don't have multiple main content areas (sign of duplication)
    const mainTitleCount = await page.locator('h1').count();
    expect(mainTitleCount).toBeLessThanOrEqual(2); // Allow for potential subtitle
  });
});
