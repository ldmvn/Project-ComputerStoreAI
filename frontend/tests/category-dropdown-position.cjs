const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.TEST_URL || 'http://localhost:3000';
const banner = { id: 1, position: 'MAIN_HERO', group: 'MAIN', name: 'Test banner', mediaType: 'IMAGE', mediaUrl: '/test-banner.svg', targetUrl: null, sortOrder: 0, isActive: true, autoplayInterval: 4500, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' };

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.route('**/api/categories/menu', route => route.fulfill({ json: { categories: [{ id: 1, name: 'Laptop', slug: 'laptop', icon: 'Laptop', children: [] }] } }));
    await page.route('**/api/banners/home', route => route.fulfill({ json: { mainHero: [banner], sideSlides: {} } }));
    await page.route('**/api/product-sections/home', route => route.fulfill({ json: { sections: [] } }));
    await page.route('**/test-banner.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700"><rect width="1600" height="700" fill="#e2e8f0"/></svg>' }));

    for (const width of [1366, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base);
      const hero = page.locator('[data-banner-position="MAIN_HERO"]');
      await hero.waitFor();
      const trigger = page.locator('header .ui-header-action');
      await trigger.click();
      const menu = page.getByRole('menu', { name: 'Danh mục sản phẩm' });
      await menu.waitFor();
      await page.waitForTimeout(250);
      const [headerBox, triggerBox, menuBox, heroBox] = await Promise.all([
        page.locator('header.site-header').boundingBox(), trigger.boundingBox(), menu.boundingBox(), hero.boundingBox(),
      ]);
      assert.ok(menuBox.y >= headerBox.y + headerBox.height + 8 && menuBox.y <= headerBox.y + headerBox.height + 12,
        `${width}px: menu should start 8-12px below Header (header ${headerBox.y + headerBox.height}px, menu ${menuBox.y}px)`);
      assert.ok(Math.abs(menuBox.y - heroBox.y) <= 14,
        `${width}px: menu should align near Banner top (menu ${menuBox.y}px, banner ${heroBox.y}px)`);
      await page.mouse.move(triggerBox.x + triggerBox.width / 2, triggerBox.y + triggerBox.height / 2);
      await page.mouse.move(menuBox.x + 20, menuBox.y + 20, { steps: 10 });
      assert.ok(await menu.isVisible(), `${width}px: menu stays open while pointer moves from trigger to dropdown`);
      console.log(`PASS ${width}px: dropdown ${Math.round(menuBox.y - headerBox.y - headerBox.height)}px below Header, ${Math.round(Math.abs(menuBox.y - heroBox.y))}px from Banner top, pointer transition remains open`);
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
