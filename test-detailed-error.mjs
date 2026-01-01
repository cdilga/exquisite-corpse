import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let detailedErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('[CONSOLE ERROR]', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.name, ':', error.message);
    console.error('Stack:', error.stack);
    detailedErrors.push({
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  });

  try {
    console.log('Loading page and waiting for errors...');
    await page.goto('http://localhost:8787', { waitUntil: 'networkidle' });

    // Wait for any deferred JavaScript errors
    await page.waitForTimeout(3000);

    // Try to evaluate some JavaScript
    const vars = await page.evaluate(() => {
      return {
        ws: typeof window.ws,
        createRoom: typeof window.createRoom,
      };
    }).catch(e => ({ error: e.message }));

    console.log('\n📊 Variable Status:', vars);

    // Get the actual HTML to inspect
    const html = await page.content();
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      const scriptContent = scriptMatch[1];
      const lines = scriptContent.split('\n');

      // Find first few lines with issues
      for (let i = 0; i < Math.min(30, lines.length); i++) {
        if (lines[i].match(/^[^\/]*[<>]/)) {
          console.log(`Line ${i}: ${lines[i].substring(0, 100)}`);
        }
      }
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    if (detailedErrors.length > 0) {
      console.log('\n❌ Captured Errors:');
      detailedErrors.forEach(err => {
        console.log(`  ${err.name}: ${err.message}`);
      });
    }
    await browser.close();
    process.exit(0);
  }
})();
