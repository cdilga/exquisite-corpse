import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  let jsErrors = [];
  let consoleMessages = [];

  // Capture console errors
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
    jsErrors.push(error.message);
  });

  try {
    console.log('📄 Loading page...');
    await page.goto('http://localhost:8787', { waitUntil: 'networkidle' });

    // Wait a bit for any deferred errors
    await page.waitForTimeout(2000);

    // Check if JavaScript variables are initialized
    const jsVars = await page.evaluate(() => {
      return {
        wsExists: typeof window.ws !== 'undefined',
        playerIdExists: typeof window.playerId !== 'undefined',
        elementsExist: typeof window.elements !== 'undefined',
        createRoomBtnExists: document.getElementById('create-room-btn') !== null,
        scriptErrorsInPage: window.errors || [],
      };
    });

    console.log('\n✅ JavaScript Variables Check:');
    console.log('  - WebSocket (ws):', jsVars.wsExists ? '✅' : '❌');
    console.log('  - playerId:', jsVars.playerIdExists ? '✅' : '❌');
    console.log('  - elements object:', jsVars.elementsExist ? '✅' : '❌');
    console.log('  - Create room button:', jsVars.createRoomBtnExists ? '✅' : '❌');

    console.log('\n📋 Captured Console Messages:');
    consoleMessages.forEach(msg => {
      console.log(`  [${msg.type}] ${msg.text}`);
    });

    if (jsErrors.length > 0) {
      console.log('\n❌ JavaScript Errors:');
      jsErrors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }

    if (consoleMessages.length === 0) {
      console.log('\n⚠️  WARNING: No console output detected');
      console.log('   This suggests the JavaScript may not be executing');
    }

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
