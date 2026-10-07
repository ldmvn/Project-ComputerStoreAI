const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const base = process.env.TEST_URL || 'http://localhost:3100';
  try {
    for (const viewport of [{ width: 1280, height: 800 }, { width: 375, height: 812 }]) {
      const page = await browser.newPage({ viewport });
      await page.clock.install();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let requestCount = 0, verifyCount = 0, resetCount = 0;
      let rejectNextSend = false;
      let documentRequests = 0;
      page.on('request', request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentRequests++; });
      await page.route('**/api/auth/forgot-password', async route => {
        requestCount++;
        await new Promise(resolve => setTimeout(resolve, 200));
        if (rejectNextSend) {
          rejectNextSend = false;
          await route.fulfill({ status: 503, json: { message: 'Không thể gửi mã xác nhận lúc này. Vui lòng thử lại.' } });
          return;
        }
        await route.fulfill({ json: { success: true, challengeId: 'a'.repeat(64), expiresIn: 300, resendAfter: 60, message: 'Nếu email tồn tại trong hệ thống, mã xác nhận đã được gửi.' } });
      });
      await page.route('**/api/auth/verify-reset-otp', async route => {
        verifyCount++;
        const otp = route.request().postDataJSON().otp;
        await route.fulfill({ status: otp === '123456' ? 200 : 400, json: otp === '123456' ? { success: true, resetToken: 'b'.repeat(64), expiresIn: 600 } : { message: 'Mã xác nhận không hợp lệ, đã hết hạn hoặc đã vượt quá số lần thử.' } });
      });
      await page.route('**/api/auth/reset-password', async route => {
        resetCount++;
        const data = route.request().postDataJSON();
        assert.equal(data.password, data.confirmPassword);
        assert.equal(data.resetToken, 'b'.repeat(64));
        await route.fulfill({ json: { success: true, message: 'Đổi mật khẩu thành công' } });
      });
      await page.goto(base + '/login');
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      const card = page.getByRole('dialog');
      await page.waitForFunction(() => {
        const dialog = document.querySelector('[role="dialog"]');
        return dialog && getComputedStyle(dialog).transform === 'matrix(1, 0, 0, 1, 0, 0)';
      });
      await card.evaluate(el => { el.dataset.testIdentity = 'same-auth-card'; });
      const initialBox = await card.boundingBox();
      const asideText = await card.locator('aside').textContent();
      const initialDocuments = documentRequests;
      const sameCard = async () => {
        assert.equal(page.url(), base + '/login', 'No navigation during auth flow');
        assert.equal(page.context().pages().length, 1, 'No new browser tab');
        assert.equal(documentRequests, initialDocuments, 'No document reload');
        assert.equal(await card.getAttribute('data-test-identity'), 'same-auth-card', 'Same card DOM element');
        assert.equal(await card.locator('aside').textContent(), asideText, 'Brand panel stays unchanged');
        const box = await card.boundingBox();
        assert.ok(Math.abs(box.width - initialBox.width) < 2, 'Card width stays unchanged');
        assert.ok(Math.abs(box.height - initialBox.height) < 2, 'Card height stays unchanged');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No horizontal overflow');
      };
      await page.getByRole('button', { name: 'Quên mật khẩu?', exact: true }).click();
      await page.getByRole('heading', { name: 'Quên mật khẩu', exact: true }).waitFor();
      await sameCard();
      await page.getByRole('button', { name: 'Quay lại đăng nhập', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Quên mật khẩu?', exact: true }).click();
      await page.getByRole('button', { name: 'Gửi mã xác nhận', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Vui lòng nhập email hợp lệ.' }).waitFor();
      assert.equal(requestCount, 0);
      await page.getByLabel('Email', { exact: true }).fill('test@example.com');
      await page.getByRole('button', { name: 'Gửi mã xác nhận', exact: true }).click();
      await page.getByRole('button', { name: 'Đang xử lý...' }).waitFor();
      await page.getByLabel('Mã OTP', { exact: true }).waitFor();
      await page.getByText('Mã hết hạn sau 05:00.', { exact: false }).waitFor();
      await sameCard();
      assert.equal(await page.getByRole('button', { name: /Gửi lại mã sau/ }).isDisabled(), true);
      await page.getByRole('button', { name: 'Quay lại đăng nhập', exact: true }).click();
      await page.getByRole('button', { name: 'Quên mật khẩu?', exact: true }).click();
      await page.getByLabel('Email', { exact: true }).fill('test@example.com');
      await page.getByRole('button', { name: 'Gửi mã xác nhận', exact: true }).click();
      await page.getByLabel('Mã OTP', { exact: true }).waitFor();
      await page.getByText('Mã hết hạn sau 05:00.', { exact: false }).waitFor();
      assert.equal(requestCount, 2, 'Reopening can issue a fresh OTP immediately');
      await page.clock.fastForward(61000);
      await page.getByRole('button', { name: 'Gửi lại mã', exact: true }).click();
      await page.getByRole('button', { name: /Gửi lại mã sau/ }).waitFor();
      assert.equal(requestCount, 3, 'Resend runs inside the same form');
      await page.getByText('Mã hết hạn sau 05:00.', { exact: false }).waitFor();
      await sameCard();
      await page.getByLabel('Mã OTP', { exact: true }).fill('000000');
      await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Mã xác nhận không hợp lệ' }).waitFor();
      await page.getByLabel('Mã OTP', { exact: true }).fill('123456');
      await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
      await page.getByLabel('Mật khẩu mới', { exact: true }).fill('SecurePassword123!');
      await sameCard();
      await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('different');
      await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Mật khẩu xác nhận không khớp.' }).waitFor();
      assert.equal(resetCount, 0);
      await page.getByRole('button', { name: 'Hiện mật khẩu mới', exact: true }).click();
      assert.equal(await page.getByLabel('Mật khẩu mới', { exact: true }).getAttribute('type'), 'text');
      await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('SecurePassword123!');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      await page.getByRole('status').filter({ hasText: 'Đổi mật khẩu thành công. Vui lòng đăng nhập.' }).waitFor();
      await sameCard();
      assert.equal(requestCount, 3);
      assert.equal(verifyCount, 2);
      assert.equal(resetCount, 1);
      assert.equal(await page.getByLabel('Mật khẩu *', { exact: true }).inputValue(), '');
      // Leave while a request is pending: its late response must not reopen recovery.
      await page.getByRole('button', { name: 'Quên mật khẩu?', exact: true }).click();
      await page.getByLabel('Email', { exact: true }).fill('test@example.com');
      await page.getByRole('button', { name: 'Gửi mã xác nhận', exact: true }).click();
      await page.getByRole('button', { name: 'Đang xử lý...' }).waitFor();
      await page.getByRole('button', { name: 'Quay lại đăng nhập', exact: true }).click();
      await page.waitForResponse(response => response.url().endsWith('/auth/forgot-password'));
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      await sameCard();
      await page.getByRole('button', { name: 'Đăng ký ngay', exact: true }).click();
      await page.getByLabel('Họ và tên *', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      // Direct legacy route uses the very same LoginModal and back switches locally.
      await page.getByRole('button', { name: 'Quên mật khẩu?', exact: true }).click();
      await page.getByLabel('Email', { exact: true }).fill('test@example.com');
      rejectNextSend = true;
      await page.getByRole('button', { name: 'Gửi mã xác nhận', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Không thể gửi mã xác nhận lúc này.' }).waitFor();
      await page.getByRole('heading', { name: 'Quên mật khẩu', exact: true }).waitFor();
      assert.equal(await page.getByLabel('Mã OTP', { exact: true }).count(), 0, 'SMTP failure does not advance to OTP');
      await page.goto(base + '/forgot-password');
      await page.getByRole('dialog').waitFor();
      await page.getByRole('heading', { name: 'Quên mật khẩu', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Quay lại đăng nhập', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      assert.equal(page.url(), base + '/forgot-password');
      await page.goto(base + '/');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Quên mật khẩu?', exact: true }).click();
      await page.getByRole('heading', { name: 'Quên mật khẩu', exact: true }).waitFor();
      assert.equal(page.url(), base + '/');
      assert.equal(page.context().pages().length, 1);
      await page.getByRole('button', { name: 'Quay lại đăng nhập', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Đóng cửa sổ đăng nhập', exact: true }).click();
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('heading', { name: 'Đăng nhập', exact: true }).waitFor();
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`Password reset UI passed at ${viewport.width}px.`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
