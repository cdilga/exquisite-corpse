import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('📸 Taking screenshot of deployed version...');
    await page.goto('https://pr-feature-game-enhancements-5.cdilga.workers.dev/', { waitUntil: 'networkidle' });

    const buffer = await page.screenshot({ fullPage: true });
    console.log(`✅ Screenshot taken (${buffer.length} bytes)`);

    import('fs').then(fs => {
      fs.writeFileSync('/tmp/deployed-duplication.png', buffer);
      console.log('✅ Saved to /tmp/deployed-duplication.png');
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
