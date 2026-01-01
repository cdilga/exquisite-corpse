import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to dev server
    console.log('📸 Taking screenshot of current state...');
    await page.goto('http://localhost:8787/', { waitUntil: 'networkidle' });

    // Take screenshot
    const buffer = await page.screenshot({ fullPage: true });
    console.log(`✅ Screenshot taken (${buffer.length} bytes)`);
    console.log('Saved to /tmp/current-game-state.png');

    // Write to temp location
    import('fs').then(fs => {
      fs.writeFileSync('/tmp/current-game-state.png', buffer);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
