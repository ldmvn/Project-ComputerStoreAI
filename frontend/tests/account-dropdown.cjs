// Uses the Playwright setup documented in tests/theme.cjs.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const role of ['USER', 'ADMIN']) {
      const context = await browser.newContext({ colorScheme: 'light' });
      await context.addInitScript(() => sessionStorage.setItem('accessToken', 'test-token'));
      await context.route('**/auth/me', (route) => route.fulfill({ json: { user: { id: 1, fullName: 'Người dùng kiểm thử', email: 'account-test@example.com', role } } }));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${process.env.THEME_TEST_URL || 'http://localhost:3100'}/home`);
      const trigger = page.getByRole('button', { name: 'Tài khoản: Người dùng kiểm thử', exact: true });
      const menu = page.getByRole('navigation', { name: 'Menu tài khoản' });
      await trigger.click();
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      assert.ok(await page.getByText('account-test@example.com', { exact: true }).isVisible());
      await page.getByText('account-test@example.com', { exact: true }).click();
      assert.ok(await menu.isVisible());
      await trigger.click();
      assert.equal(await menu.count(), 0);
      await trigger.click();
      await page.keyboard.press('Escape');
      assert.equal(await menu.count(), 0);
      assert.ok(await trigger.evaluate((el) => el === document.activeElement));
      await page.keyboard.press('Enter');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Tài khoản của tôi');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      assert.equal(await menu.count(), 0);
      await trigger.click();
      await page.locator('input[type="search"]').click();
      assert.equal(await menu.count(), 0);
      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await trigger.click();
        const box = await menu.locator('..').boundingBox();
        assert.ok(box && box.x >= 0 && box.x + box.width <= width, `Dropdown fits ${width}px`);
        assert.ok(box.width >= 230 && box.width <= 270);
        await page.keyboard.press('Escape');
      }
      await trigger.click();
      const panel = menu.locator('..');
      assert.equal(await panel.evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
      await page.getByRole('switch').click();
      await trigger.click();
      assert.equal(await panel.evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(15, 23, 42)');
      await page.evaluate(() => { window.accountNavigationMarker = true; });
      await menu.getByRole('link', { name: 'Tài khoản của tôi' }).click();
      await page.waitForURL('**/account');
      await page.getByRole('heading', { name: 'Tài khoản của tôi' }).waitFor();
      assert.equal(await page.evaluate(() => window.accountNavigationMarker), true);
      assert.equal(await menu.count(), 0);
      await trigger.click();
      await menu.getByRole('link', { name: 'Đơn hàng của tôi' }).click();
      await page.waitForURL('**/orders');
      await page.getByRole('heading', { name: 'Đơn hàng của tôi' }).waitFor();
      await trigger.click();
      await menu.getByRole('button', { name: 'Đăng xuất' }).click();
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
      assert.equal(await menu.count(), 0);
      assert.equal(await page.evaluate(() => sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')), null);
      assert.equal(await page.evaluate(() => window.accountNavigationMarker), true);
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      assert.deepEqual(errors, []);
      console.log(`PASS ${role}: open/close, user data, outside click, Escape, keyboard, responsive, themes, navigation, logout, guest login`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
