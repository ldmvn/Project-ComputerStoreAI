// Uses the Playwright setup documented in tests/theme.cjs.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const role of [null, 'USER', 'ADMIN']) {
      const context = await browser.newContext({ colorScheme: 'light' });
      if (role) {
        await context.addInitScript(() => sessionStorage.setItem('accessToken', 'test-token'));
        await context.route('**/auth/me', (route) => route.fulfill({ json: { user: { id: 1, fullName: 'Người dùng có tên rất dài để kiểm tra responsive', email: 'responsive@example.com', role } } }));
      }
      const page = await context.newPage();
      await page.goto(`${process.env.THEME_TEST_URL || 'http://localhost:3100'}/home`);
      const header = page.locator('header');
      const account = header.getByRole('button', { name: role ? /^Tài khoản:/ : 'Đăng nhập', exact: !role });
      await account.waitFor();
      for (const width of [320, 360, 430, 640, 768, 1024, 1366, 1920]) {
        await page.setViewportSize({ width, height: 960 });
        for (const dark of [false, true]) {
          if (dark) await header.getByRole('switch').click();
          const actions = [header.getByRole('switch'), header.getByRole('link', { name: 'Yêu thích', exact: true }), header.getByRole('link', { name: 'Giỏ hàng', exact: true })];
          assert.equal(await header.getByRole('link', { name: 'Dashboard', exact: true }).count(), role === 'ADMIN' ? 1 : 0);
          if (role === 'ADMIN') actions.push(header.getByRole('link', { name: 'Dashboard', exact: true }));
          actions.push(account);
          const logo = await header.locator('img').boundingBox();
          let previousRight = logo.x + logo.width;
          for (const action of actions) {
            assert.ok(await action.isVisible());
            const box = await action.boundingBox();
            assert.ok(box.x >= previousRight - 1 && box.x + box.width <= width, `${role} ${width}: action overlap/overflow`);
            assert.ok(Math.abs(box.y + box.height / 2 - logo.y - logo.height / 2) < 2, `${role} ${width}: single top row`);
            assert.ok(await action.evaluate((el) => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), 'Action is not obscured');
            previousRight = box.x + box.width;
          }
          const search = await header.locator('input[type="search"]').boundingBox();
          if (width < 1024) {
            assert.ok(search.y >= logo.y + logo.height && search.width >= (await header.boundingBox()).width - 34, 'Full-width second search row');
          } else {
            assert.ok(Math.abs(search.y + search.height / 2 - logo.y - logo.height / 2) < 2, 'Desktop search stays on first row');
            assert.ok(search.width >= 100 && search.width <= 501, `Desktop search width ${search.width}`);
          }
          assert.ok(await header.evaluate((el) => el.scrollWidth <= el.clientWidth), 'No header horizontal overflow');
          if (role) {
            await account.click();
            const panel = await page.getByRole('navigation', { name: 'Menu tài khoản' }).locator('..').boundingBox();
            assert.ok(panel.x >= 0 && panel.x + panel.width <= width, 'Account dropdown fits');
            await page.keyboard.press('Escape');
          }
          if (dark) await header.getByRole('switch').click();
        }
      }
      console.log(`PASS ${role || 'guest'}: 320–1920px, light/dark, visible actions, search rows, no overlap, dropdown bounds`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
