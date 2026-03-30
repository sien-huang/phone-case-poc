const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('PAGE ERROR:', msg.text());
    } else if (msg.type() === 'warning') {
      console.warn('PAGE WARNING:', msg.text());
    } else {
      // Uncomment to see all logs
      // console.log('PAGE LOG:', msg.type(), msg.text());
    }
  });

  // Capture page errors (unhandled exceptions)
  page.on('pageerror', err => {
    console.error('PAGE UNHANDLED ERROR:', err.message);
  });

  try {
    console.log('Navigating to http://localhost:3000 ...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded, title:', await page.title());

    // Wait a bit for async effects
    await page.waitForTimeout(2000);
  } catch (e) {
    console.error('NAVIGATION ERROR:', e.message);
  } finally {
    await browser.close();
  }
})();
