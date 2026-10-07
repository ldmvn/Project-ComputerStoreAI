const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');

// Browser integration against the built frontend. Backend/Google responses are
// fixtures; backend's separate integration suite verifies the real DB and JWT.
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const base = process.env.TEST_URL || 'http://localhost:3100';
  const user = { id: 919191, fullName: 'Google Browser Test', email: 'google-browser@example.com', phone: null, role: 'USER', avatarUrl: 'https://example.com/avatar.png', isActive: true };
  try {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      let challenge, exchanges = 0, failure = null, rejectExchange = false;
      await page.route('**/api/auth/google?*', async route => {
        const params = new URL(route.request().url()).searchParams;
        challenge = params.get('challenge');
        assert.match(challenge, /^[A-Za-z0-9_-]{43}$/);
        const result = failure ? 'error=' + failure : 'code=' + 'a'.repeat(43);
        await route.fulfill({ status: 302, headers: { location: base + '/auth/google/callback#' + result } });
      });
      await page.route('**/api/auth/google/exchange', async route => {
        exchanges++;
        const data = route.request().postDataJSON();
        assert.equal(data.code, 'a'.repeat(43));
        assert.equal(createHash('sha256').update(data.verifier).digest('base64url'), challenge);
        await route.fulfill({ status: rejectExchange ? 400 : 200, headers: { 'access-control-allow-origin': base }, json: rejectExchange ? { message: 'Exchange expired' } : { success: true, user, token: 'browser-test-jwt' } });
      });
      await page.route('**/api/auth/me', route => route.fulfill({ headers: { 'access-control-allow-origin': base }, json: { success: true, user } }));
      await page.route('**/api/categories', route => route.fulfill({ json: { categories: [] } }));
      await page.route('**/api/banners', route => route.fulfill({ json: { banners: [] } }));
      await page.route('**/api/product-sections', route => route.fulfill({ json: { sections: [] } }));
      for (const rememberMe of [false, true]) {
        await page.goto(base + '/login');
        await page.locator('#modal-login-email').waitFor();
        await page.locator('form input[type="checkbox"]').setChecked(rememberMe);
        const before = exchanges;
        await page.locator('form').getByRole('button', { name: /Google/ }).click();
        await page.waitForURL(base + '/');
        await page.getByRole('button', { name: 'T\u00e0i kho\u1ea3n: ' + user.fullName, exact: true }).waitFor();
        assert.equal(exchanges, before + 1, 'Exactly one exchange despite React StrictMode');
        assert.equal(await page.getByRole('dialog').count(), 0, 'LoginModal is closed');
        const stored = await page.evaluate(() => ({ local: localStorage.getItem('accessToken'), session: sessionStorage.getItem('accessToken'), pending: sessionStorage.getItem('googleLoginPending'), user: localStorage.getItem('authUser') || sessionStorage.getItem('authUser') }));
        assert.equal(stored.local, rememberMe ? 'browser-test-jwt' : null);
        assert.equal(stored.session, rememberMe ? null : 'browser-test-jwt');
        assert.equal(JSON.parse(stored.user).id, user.id);
        assert.equal(stored.pending, null);
        await page.reload();
        await page.getByRole('button', { name: 'T\u00e0i kho\u1ea3n: ' + user.fullName, exact: true }).waitFor();
        await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      }
      // Login from the header preserves the originating page and closes its modal.
      await page.goto(base + '/customer/products');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await page.locator('form').getByRole('button', { name: /Google/ }).click();
      await page.waitForURL(base + '/customer/products');
      await page.getByRole('button', { name: 'Tài khoản: ' + user.fullName, exact: true }).waitFor();
      assert.equal(await page.getByRole('dialog').count(), 0);
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      // The Google button in registration uses the same create-or-login flow.
      await page.goto(base + '/login');
      await page.getByRole('button', { name: 'Đăng ký ngay', exact: true }).click();
      await page.locator('#modal-register-name').waitFor();
      await page.locator('form').getByRole('button', { name: /Google/ }).click();
      await page.waitForURL(base + '/');
      await page.getByRole('button', { name: 'Tài khoản: ' + user.fullName, exact: true }).waitFor();
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      for (const error of ['cancelled', 'invalid_token', 'missing_email', 'oauth_failed', 'not_configured', 'account_disabled', 'invalid_state']) {
        failure = error;
        await page.goto(base + '/login');
        await page.locator('form').getByRole('button', { name: /Google/ }).click();
        await page.locator('p[role="alert"]').waitFor();
        assert.equal(new URL(page.url()).hash, '', 'Callback fragment is removed');
        assert.equal(await page.evaluate(() => sessionStorage.getItem('googleLoginPending')), null);
        await page.getByRole('link').click();
        await page.locator('#modal-login-email').waitFor();
      }
      failure = null;
      rejectExchange = true;
      await page.locator('form').getByRole('button', { name: /Google/ }).click();
      await page.locator('p[role="alert"]').filter({ hasText: 'Exchange expired' }).waitFor();
      rejectExchange = false;
      // Direct callback without a matching initiation is rejected.
      const before = exchanges;
      await page.goto(base + '/auth/google/callback#code=' + 'a'.repeat(43));
      await page.locator('p[role="alert"]').waitFor();
      assert.equal(exchanges, before);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.deepEqual(pageErrors, []);
      await context.close();
      console.log(`Google Login browser tests passed at ${viewport.width}px (simulated provider).`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
