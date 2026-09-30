// Run against a built site: THEME_TEST_URL=http://localhost:3100 node tests/theme.cjs
// Requires Playwright (or PLAYWRIGHT_MODULE pointing to its installed module).
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const base = process.env.THEME_TEST_URL || 'http://localhost:3100';
  const errors = [];
  const context = await browser.newContext({ colorScheme: 'light' });
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /hydration|did not match/i.test(message.text())) errors.push(message.text());
  });
  const toggle = () => page.getByRole('switch', { name: 'Chuyển chế độ sáng/tối' });
  async function checkTheme(dark) {
    await page.waitForFunction((value) => document.documentElement.classList.contains('dark') === value, dark);
    if (await toggle().count()) {
      await page.waitForFunction((value) => document.querySelector('[role="switch"]').getAttribute('aria-checked') === String(value), dark);
    }
    assert.equal(await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor), dark ? 'rgb(15, 23, 42)' : 'rgb(248, 250, 252)');
  }
  try {
    await page.goto(`${base}/home`);
    await checkTheme(false);
    await toggle().click();
    await checkTheme(true);
    assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark');
    for (const selector of ['header', 'footer', 'input[type="search"]']) {
      assert.notEqual(await page.locator(selector).evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
    }
    await page.reload();
    await checkTheme(true);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    assert.equal(await page.getByRole('dialog').evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(15, 23, 42)');
    assert.equal(await page.locator('#modal-login-email').evaluate((el) => getComputedStyle(el).color), 'rgb(255, 255, 255)');
    await page.getByRole('dialog').getByRole('button', { name: 'Đăng ký ngay', exact: true }).click();
    assert.equal(await page.locator('#modal-register-name').evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(2, 6, 23)');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Danh mục', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Laptop', exact: true }).hover();
    assert.equal(await page.getByLabel('Mega Menu Laptop', { exact: true }).evaluate((el) => getComputedStyle(el).backgroundColor), 'rgb(2, 6, 23)');
    await page.mouse.move(1200, 700);
    await page.getByRole('link', { name: 'Giỏ hàng', exact: true }).click();
    await page.waitForURL('**/cart');
    await checkTheme(true);
    await page.getByRole('link', { name: 'Về trang chủ' }).click();
    await page.waitForURL('**/home');
    await checkTheme(true);
    await toggle().click();
    await checkTheme(false);
    await page.reload();
    await checkTheme(false);
    await page.emulateMedia({ colorScheme: 'dark' });
    await checkTheme(false); // Explicit light overrides the OS.
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({ width, height: 812 });
      const box = await toggle().boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= width, `Switch fits ${width}px`);
      await toggle().click();
      await checkTheme(true);
      await toggle().focus();
      await page.keyboard.press('Space');
      await checkTheme(false);
    }
    const other = await context.newPage();
    await other.goto(`${base}/home`);
    await other.getByRole('switch').click();
    await checkTheme(true); // Cross-tab synchronization.
    await other.close();
    assert.deepEqual(errors, []);
    console.log('PASS: toggle, persistence, routes, auth dialogs, mega menu, mobile, keyboard, cross-tab, hydration');

    for (const stored of [null, 'invalid', 'light', 'dark']) {
      const early = await browser.newContext({ javaScriptEnabled: true, colorScheme: 'dark' });
      await early.addInitScript((value) => {
        if (value !== null) localStorage.setItem('theme', value);
      }, stored);
      // Block React bundles: the head script must apply theme before hydration.
      await early.route('**/_next/static/**/*.js', (route) => route.abort());
      const tab = await early.newPage();
      await tab.goto(`${base}/home`);
      assert.equal(await tab.locator('html').evaluate((el) => el.classList.contains('dark')), stored !== 'light');
      await early.close();
    }
    const blocked = await browser.newContext({ colorScheme: 'dark' });
    await blocked.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
    });
    const tab = await blocked.newPage();
    await tab.goto(`${base}/home`);
    await tab.getByRole('switch').click();
    assert.equal(await tab.locator('html').evaluate((el) => el.classList.contains('dark')), false);
    await blocked.close();
    console.log('PASS: pre-hydration theme, system fallback, invalid storage, blocked storage');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
