const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const base = process.env.TEST_URL || 'http://localhost:3100';
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    for (const path of ['/', '/customer/products?category=laptop&search=pc', '/customer/cart', '/customer/checkout', '/customer/profile', '/customer/profile/orders', '/customer/wishlist', '/customer/build-pc']) {
      const response = await page.goto(base + path);
      assert.equal(response.status(), 200, path);
      await page.locator('header').waitFor();
      assert.equal(await page.locator('header').count(), 1);
      assert.equal(await page.locator('footer').count(), 1);
    }
    for (const [old, next] of [['/home', '/'], ['/account', '/customer/profile'], ['/orders', '/customer/profile/orders'], ['/build-pc', '/customer/build-pc'], ['/products?search=pc', '/customer/products?search=pc']]) {
      await page.goto(base + old);
      assert.equal(new URL(page.url()).pathname + new URL(page.url()).search, next);
    }
    assert.equal((await page.goto(base + '/customer/does-not-exist')).status(), 404);
    assert.deepEqual(errors.filter(error => !error.includes('404 (Not Found)')), []);
    console.log('PASS: storefront routes, single shell, redirects, query preservation, expected 404, no hydration/console errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
