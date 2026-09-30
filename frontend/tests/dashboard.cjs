// Run with the same Playwright setup as tests/theme.cjs, against a built site.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const base = process.env.THEME_TEST_URL || 'http://localhost:3100';
  try {
    for (const role of [null, 'USER', 'ADMIN', 'EXPIRED']) {
      const context = await browser.newContext();
      const user = { id: 1, fullName: 'Test Account', email: 'test@example.com', phone: '0123456789', role };
      if (role) {
        await context.addInitScript(() => {
          localStorage.setItem('accessToken', 'test-token');
          // A forged cached role must not grant access.
          localStorage.setItem('authUser', JSON.stringify({ role: 'ADMIN' }));
        });
      }
      await context.route('**/auth/me', async (route) => {
        await route.fulfill({ status: role === 'EXPIRED' ? 401 : 200, json: { user } });
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${base}/dashboard`);
      if (role !== 'ADMIN') {
        await page.waitForURL('**/home');
        assert.equal(await page.getByRole('heading', { name: 'Dashboard', exact: true }).count(), 0);
        assert.equal(await page.getByRole('link', { name: 'Dashboard', exact: true }).count(), 0);
        await page.setViewportSize({ width: 375, height: 812 });
        await page.getByRole('button', { name: 'Toggle menu' }).click();
        assert.equal(await page.getByRole('link', { name: 'Dashboard', exact: true }).count(), 0);
      } else {
        await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
        await page.reload();
        await page.getByRole('heading', { name: 'Dashboard', exact: true }).waitFor();
        await page.getByRole('link', { name: 'Về trang chủ' }).click();
        await page.waitForURL('**/home');
        // A client-side transition preserves this marker.
        await page.evaluate(() => { window.dashboardNavigationMarker = true; });
        await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
        await page.waitForURL('**/dashboard');
        assert.equal(await page.evaluate(() => window.dashboardNavigationMarker), true);
        for (const width of [320, 375, 768, 1024, 1280, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          const link = page.getByRole('link', { name: 'Dashboard', exact: true }).filter({ visible: true });
          const box = await link.boundingBox();
          assert.ok(box && box.x >= 0 && box.x + box.width <= width, `Dashboard fits ${width}px`);
          await link.click();
          const search = await page.locator('input[type="search"]').boundingBox();
          assert.ok(search && search.width > 50 && search.x + search.width <= width, `Search remains usable at ${width}px`);
        }
        await page.getByRole('switch').click();
        await page.waitForFunction(() => getComputedStyle(document.querySelector('header a[href="/dashboard"]')).color === 'rgb(203, 213, 225)');
        assert.equal(await page.getByRole('link', { name: 'Dashboard', exact: true }).evaluate((el) => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
        await page.getByRole('button', { name: 'Tài khoản: Test Account', exact: true }).click();
        await page.getByRole('button', { name: 'Đăng xuất' }).click();
        await page.waitForURL('**/home');
        assert.equal(await page.getByRole('link', { name: 'Dashboard', exact: true }).count(), 0);
      }
      assert.deepEqual(errors, []);
      console.log(`PASS: ${role || 'guest'} access and navigation`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
