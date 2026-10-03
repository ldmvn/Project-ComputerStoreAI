const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.TEST_URL || 'http://localhost:3000';
const user = { id: 1, fullName: 'Hover Admin', email: 'hover@example.com', role: 'ADMIN' };
const product = id => ({ id, name: `PC Gaming ${id}`, slug: `pc-${id}`, sku: `PC-${id}`, price: 18000000,
  primaryImage: '/hover-media.svg', stockQuantity: 10, isActive: true, category: 'PC', images: [],
  createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
  specifications: [{ id, name: 'CPU', value: 'Intel Core i5' }] });
const banner = (id, position) => ({ id, position, group: position === 'MAIN_HERO' ? 'MAIN' : 'SIDE',
  name: `Banner ${id}`, mediaType: 'IMAGE', mediaUrl: '/hover-media.svg', targetUrl: null,
  sortOrder: 0, isActive: true, autoplayInterval: 1200, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' });
const sides = ['SIDE_LEFT', 'SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'];
const banners = [banner(1, 'MAIN_HERO'), banner(2, 'MAIN_HERO'), ...sides.map((position, i) => banner(i + 3, position))];
const section = { id: 7, name: 'PC Gaming', subtitle: null, viewAllUrl: '/customer/products',
  isActive: true, sortOrder: 0, products: Array.from({ length: 8 }, (_, i) => product(i + 1)) };
const errors = [];
const writes = [];

async function setup(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, ...options });
  await context.addInitScript(() => sessionStorage.setItem('accessToken', 'hover-test-token'));
  await context.route('**/api/**', route => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() !== 'GET') {
      writes.push(`${request.method()} ${url.pathname}`);
      return route.fulfill({ status: 403, json: { message: 'UI test does not write data' } });
    }
    let json = {};
    if (url.pathname.endsWith('/auth/me')) json = { user };
    else if (url.pathname.endsWith('/banners/home')) json = { mainHero: banners.slice(0, 2),
      sideSlides: Object.fromEntries(sides.map((position, i) => [position, [banners[i + 2]]])),
      sideLeft: banners[2], sideRightTop: banners[3], sideRightMiddle: banners[4], sideRightBottom: banners[5],
      bottomLeft: banners[6], bottomRight: banners[7] };
    else if (url.pathname.endsWith('/product-sections/home')) json = { sections: [section] };
    else if (url.pathname.endsWith('/categories/menu')) json = { categories: [{ id: 1, name: 'PC', slug: 'pc', icon: 'Monitor', children: [] }] };
    else if (url.pathname.endsWith('/admin/categories')) json = { categories: [{ id: 1, name: 'PC', slug: 'pc', icon: 'Monitor', description: null, parentId: null, parent: null, sortOrder: 0, isActive: true, productCount: 1, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' }] };
    else if (url.pathname.endsWith('/admin/products')) json = { products: [product(1)],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 }, stats: { total: 1, active: 1, outOfStock: 0, inactive: 0 } };
    else if (url.pathname.endsWith('/admin/banners')) json = { banners };
    else if (url.pathname.endsWith('/admin/product-sections')) json = { sections: [section] };
    return route.fulfill({ json });
  });
  await context.route('**/hover-media.svg', route => route.fulfill({ contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700"><rect width="1600" height="700" fill="#ffedd5"/><rect x="640" y="80" width="320" height="540" rx="24" fill="#334155"/></svg>' }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  return { context, page };
}

const style = locator => locator.evaluate(el => {
  const css = getComputedStyle(el);
  return { translate: css.translate, scale: css.scale, transform: css.transform, shadow: css.boxShadow,
    background: css.backgroundColor, color: css.color, duration: css.transitionDuration,
    offset: [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight],
    box: { x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y,
      width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height } };
});
async function hover(page, locator) { await locator.hover(); await page.waitForTimeout(260); }
async function clearHover(page) { await page.mouse.move(0, 0); await page.waitForTimeout(260); }
function near(actual, expected, message) { assert.ok(Math.abs(actual - expected) < 0.15, `${message}: ${actual}`); }
async function noOverflow(page, label) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label);
}

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const { context, page } = await setup(browser);
    for (const width of [1366, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1100 });
      await page.goto(base);
      await page.locator('#home-products-7').waitFor();
      await page.locator('header a[href="/admin/dashboard"]').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const headerActions = page.locator('header .header-action');
      for (const action of await headerActions.all()) {
        if (!(await action.isVisible())) continue;
        const icon = action.locator(':scope > svg').first();
        const before = await style(action);
        await hover(page, action);
        assert.equal((await style(icon)).translate, '0px -2px');
        assert.equal((await style(icon)).scale, '1.05');
        assert.deepEqual((await style(action)).offset, before.offset, 'Header hitbox stays in place');
      }
      const search = page.locator('.ui-search');
      const searchTransform = (await style(search.locator('svg'))).transform;
      await hover(page, search);
      assert.equal((await style(search.locator('svg'))).translate, '0px -2px');
      assert.equal((await style(search.locator('svg'))).transform, searchTransform, 'Search positioning preserved');

      const categoryTrigger = page.locator('header .ui-header-action');
      await categoryTrigger.click();
      const categoryMenu = page.getByRole('menu', { name: 'Danh mục sản phẩm' });
      await page.waitForTimeout(250);
      const menuBox = await categoryMenu.boundingBox();
      const bannerBox = await page.locator('[data-banner-position="MAIN_HERO"]').boundingBox();
      const headerBox = await page.locator('header.site-header').boundingBox();
      const wrapperBox = await categoryTrigger.boundingBox();
      assert.ok(menuBox.y >= headerBox.height + 8 && menuBox.y <= headerBox.height + 12, `Category dropdown clears header by 8–12px: menu ${menuBox.y}px, header ${headerBox.height}px`);
      assert.ok(Math.abs(menuBox.y - bannerBox.y) <= 14, `Category dropdown aligns near banner top: menu ${menuBox.y}px, banner ${bannerBox.y}px, trigger ${wrapperBox.y}px/${wrapperBox.height}px`);
      await page.mouse.move((await categoryTrigger.boundingBox()).x + 10, (await categoryTrigger.boundingBox()).y + 10);
      await page.mouse.move(menuBox.x + 10, menuBox.y + 10, { steps: 8 });
      assert.ok(await categoryMenu.isVisible(), 'Dropdown stays open while moving from trigger to menu');
      const category = page.getByRole('menuitem').first();
      const categoryBefore = await style(category);
      await hover(page, category);
      assert.equal((await style(category)).translate, '2px');
      assert.equal((await style(category)).background, 'rgb(255, 247, 237)');
      assert.deepEqual((await style(category)).offset, categoryBefore.offset);
      await clearHover(page);

      for (const slot of await page.locator('.ui-banner').all()) {
        const before = await style(slot);
        const parentBefore = await style(slot.locator('..'));
        await hover(page, slot);
        const after = await style(slot);
        assert.equal(after.translate, '0px -2px');
        assert.deepEqual(after.offset, before.offset);
        assert.deepEqual((await style(slot.locator('..'))).offset, parentBefore.offset);
      }
      const hero = page.locator('[data-banner-position="MAIN_HERO"]');
      await hover(page, hero);
      const slide = hero.locator('[aria-roledescription="slide"]');
      const active = await slide.getAttribute('aria-label');
      await page.waitForFunction(value => document.querySelector('[data-banner-position="MAIN_HERO"] [aria-roledescription="slide"]').getAttribute('aria-label') !== value, active);
      const next = hero.locator('button').nth(1);
      assert.equal(await next.evaluate(el => getComputedStyle(el).opacity), '1');
      const arrowBefore = await style(next);
      await next.click();
      assert.equal((await style(next)).transform, arrowBefore.transform, 'Banner arrows keep vertical centering');
      await clearHover(page);
      assert.equal(await next.evaluate(el => getComputedStyle(el).opacity), '0');

      const cards = page.locator('section[aria-labelledby="home-products-7"] article');
      const card = cards.first();
      await card.scrollIntoViewIfNeeded();
      await clearHover(page);
      const before = await style(card);
      const neighborBefore = await style(cards.nth(1));
      const image = card.locator('img');
      await hover(page, card);
      const after = await style(card);
      near(after.box.y - before.box.y, -4, 'Product card lift');
      assert.deepEqual(after.offset, before.offset, 'Card dimensions and flow unchanged');
      assert.deepEqual((await style(cards.nth(1))).box, neighborBefore.box, 'Neighbor stays still');
      near(await image.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a), 1.03, 'Product image scale');
      assert.equal(await image.locator('..').evaluate(el => getComputedStyle(el).overflow), 'hidden');
      assert.notEqual((await style(card.locator('ul'))).shadow, 'none');
      assert.equal((await style(image)).duration, '0.22s');
      assert.ok(after.duration.split(', ').every(value => value === '0.18s'));
      assert.ok(after.box.y >= await card.locator('..').evaluate(el => el.getBoundingClientRect().y), 'Lift does not clip top of card');
      const viewAll = page.locator('section[aria-labelledby="home-products-7"] a');
      await hover(page, viewAll);
      assert.equal((await style(viewAll.locator('svg'))).translate, '3px');
      await noOverflow(page, `Home ${width}: no overflow while hovering`);

      await page.goto(base + '/admin/products');
      await page.locator('main .ui-card').first().waitFor();
      const stat = page.locator('main .ui-card').first();
      await hover(page, stat);
      assert.equal((await style(stat)).translate, '0px -2px');
      const selected = page.locator('aside a[aria-current="page"]');
      const selectedBefore = await style(selected);
      await hover(page, selected);
      assert.equal((await style(selected)).background, selectedBefore.background);
      assert.equal((await style(selected)).color, selectedBefore.color);
      assert.equal((await style(selected.locator('svg'))).translate, 'none', 'Active sidebar stays still');
      const inactive = page.locator('aside a.ui-menu-item:not([aria-current])').first();
      await hover(page, inactive);
      assert.equal((await style(inactive)).background, 'rgb(255, 247, 237)');
      assert.equal((await style(inactive.locator('svg'))).translate, '2px');
      const disabled = page.locator('main button.ui-button:disabled').first();
      await hover(page, disabled);
      assert.equal((await style(disabled)).translate, 'none');
      const add = page.locator('main button.ui-button--primary').first();
      await clearHover(page);
      const addBefore = await style(add);
      await hover(page, add);
      assert.equal((await style(add)).translate, '0px -1px');
      assert.deepEqual((await style(add)).offset, addBefore.offset);
      await page.mouse.down();
      await page.waitForTimeout(220);
      assert.equal((await style(add)).scale, '0.98');
      await page.mouse.up();
      const modal = page.getByRole('dialog');
      await modal.waitFor();
      const modalBefore = await style(modal);
      await hover(page, modal);
      assert.deepEqual((await style(modal)).box, modalBefore.box, 'Modal stays still while editing');
      assert.equal((await style(modal)).translate, 'none');
      await page.keyboard.press('Escape');
      await noOverflow(page, `Dashboard ${width}: no overflow`);
      await page.goto(base + '/admin/banners');
      await page.locator('article.ui-card').first().waitFor();
      await hover(page, page.locator('article.ui-card').first());
      assert.equal((await style(page.locator('article.ui-card').first())).translate, '0px -2px');
      await page.goto(base + '/admin/product-sections');
      await page.locator('article.ui-card').first().waitFor();
      await hover(page, page.locator('article.ui-card').first());
      assert.equal((await style(page.locator('article.ui-card').first())).translate, '0px -2px');
      console.log(`PASS ${width}px: header, search, category, banners/autoplay/arrows, cards/images/specs, buttons, sidebar, modal, management cards; stable layout`);
    }
    await context.close();

    for (const width of [390, 768, 1440]) {
      const { context: touchContext, page: touch } = await setup(browser, { isMobile: true, hasTouch: true, viewport: { width, height: 1100 } });
      await touch.goto(base);
      await touch.locator('#home-products-7').waitFor();
      assert.equal(await touch.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches), false);
      const card = touch.locator('section[aria-labelledby="home-products-7"] article').first();
      await hover(touch, card);
      assert.equal((await style(card)).transform, 'none');
      assert.equal((await style(card.locator('img'))).transform, 'none');
      await hover(touch, touch.locator('.ui-banner').first());
      assert.equal((await style(touch.locator('.ui-banner').first())).translate, 'none');
      const headerAction = touch.locator('header .header-action:visible').first();
      const headerBackground = (await style(headerAction)).background;
      await hover(touch, headerAction);
      assert.equal((await style(headerAction)).background, headerBackground, 'No sticky Tailwind hover on touch');
      assert.equal((await style(headerAction.locator('svg').first())).scale, 'none');
      const subscribe = touch.locator('footer button.ui-button');
      await subscribe.scrollIntoViewIfNeeded();
      await subscribe.tap();
      const cdp = await touchContext.newCDPSession(touch);
      // Inspect the pressed CSS state separately: a native tap releases immediately.
      await cdp.send('DOM.enable');
      await cdp.send('CSS.enable');
      const { root } = await cdp.send('DOM.getDocument');
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'footer button.ui-button' });
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
      await touch.waitForTimeout(240);
      assert.equal((await style(subscribe)).scale, '0.98', 'Touch devices retain pressed-state feedback styles');
      await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: [] });
      await noOverflow(touch, `Touch ${width}: no overflow`);
      await touchContext.close();
      console.log(`PASS touch ${width}px: no simulated hover; tap feedback available`);
    }

    const { context: reducedContext, page: reduced } = await setup(browser, { reducedMotion: 'reduce' });
    await reduced.goto(base);
    await reduced.locator('#home-products-7').waitFor();
    const card = reduced.locator('section[aria-labelledby="home-products-7"] article').first();
    await hover(reduced, card);
    assert.equal((await style(card)).transform, 'none');
    assert.equal((await style(card)).duration, '0s');
    assert.equal((await style(card.locator('img'))).transform, 'none');
    await hover(reduced, reduced.locator('.ui-banner').first());
    assert.equal((await style(reduced.locator('.ui-banner').first())).translate, 'none');
    await hover(reduced, reduced.locator('header .header-action:visible').first());
    assert.equal((await style(reduced.locator('header .header-action:visible').first().locator('svg').first())).scale, 'none');
    await reducedContext.close();
    assert.deepEqual(errors, [], 'No browser runtime errors');
    assert.deepEqual(writes, [], 'UI tests do not write API/database data');
    console.log('PASS reduced motion: no lifts/zooms; no runtime errors or API writes');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
