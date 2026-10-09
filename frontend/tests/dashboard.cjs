const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const base = process.env.TEST_URL || 'http://localhost:3100';
  try {
    for (const role of [null, 'USER', 'ADMIN', 'EXPIRED']) {
      const context = await browser.newContext();
      if (role) await context.addInitScript(() => {
        localStorage.setItem('accessToken', 'test-token');
        localStorage.setItem('authUser', JSON.stringify({ role: 'ADMIN' }));
      });
      await context.route('**/auth/me', route => route.fulfill({ status: role === 'EXPIRED' ? 401 : 200, json: { user: { id: 1, fullName: 'Test Account', email: 'test@example.com', phone: '0123456789', role } } }));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const path of ['/admin/dashboard', '/admin/products', '/admin/orders', '/admin/settings/store']) {
        await page.goto(base + path);
        if (role !== 'ADMIN') {
          await page.waitForURL(base + '/');
          assert.equal(await page.getByRole('navigation', { name: 'Điều hướng quản trị' }).count(), 0);
        } else {
          await page.getByRole('navigation', { name: 'Điều hướng quản trị' }).waitFor();
          await page.locator('main h1').waitFor();
        }
      }
      if (role === 'ADMIN') {
        await page.goto(base + '/admin/dashboard');
        for (const [width, expectedPadding] of [[375, 16], [768, 24], [1440, 32], [1920, 40]]) {
          await page.setViewportSize({ width, height: 900 });
          const layout = await page.locator('main').evaluate(main => {
            const content = main.firstElementChild.getBoundingClientRect();
            const style = getComputedStyle(main);
            const bounds = main.getBoundingClientRect();
            return { padding: parseFloat(style.paddingLeft), contentLeft: content.left, contentRight: content.right, mainLeft: bounds.left, mainRight: bounds.right, pageWidth: document.documentElement.scrollWidth };
          });
          assert.equal(layout.padding, expectedPadding, `${width}px main horizontal padding`);
          assert.ok(Math.abs(layout.contentLeft - layout.mainLeft - expectedPadding) < 1, `${width}px content left inset`);
          assert.ok(Math.abs(layout.mainRight - layout.contentRight - expectedPadding) < 1, `${width}px content uses full available width`);
          assert.ok(layout.pageWidth <= width + 1, `${width}px no horizontal page scroll`);
        }
        await page.getByRole('button', { name: 'Thu gọn sidebar', exact: true }).click();
        await page.getByRole('button', { name: 'Mở rộng sidebar', exact: true }).click();
        await page.setViewportSize({ width: 375, height: 812 });
        await page.getByRole('button', { name: 'Mở menu dashboard', exact: true }).click();
        await page.getByRole('button', { name: 'Cửa hàng', exact: true }).click();
        await page.getByRole('link', { name: 'Sản phẩm', exact: true }).click();
        await page.waitForURL(base + '/admin/products');
        await page.getByRole('link', { name: 'Xem cửa hàng' }).click();
        await page.waitForURL(base + '/');
        await page.getByRole('button', { name: 'Tài khoản: Test Account' }).click();
        await page.getByRole('button', { name: 'Đăng xuất' }).click();
        // The init script seeds every document; disable it by rejecting the
        // synthetic token on the following full navigation.
        await context.unroute('**/auth/me');
        await context.route('**/auth/me', route => route.fulfill({ status: 401, json: { message: 'Expired' } }));
        await page.goto(base + '/admin/orders');
        await page.waitForURL(base + '/');
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${role || 'guest'}: admin routes and access protection`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
