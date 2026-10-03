const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('../../backend/node_modules/sharp');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const base = process.env.TEST_URL || 'http://localhost:3000';
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'banner-responsive-'));
  const errors = [];
  try {
    const png = await sharp({ create: { width: 800, height: 350, channels: 3, background: '#fb923c' } }).png().toBuffer();
    const fixture = (id, position) => ({ id, position, name: position + id, group: position.startsWith('MAIN') ? 'MAIN' : 'SIDE', mediaType: 'IMAGE', mediaUrl: position.startsWith('SIDE') ? '/media/banners/side-responsive.png' : '/media/banners/responsive.png', targetUrl: '/customer/products', altText: position, sortOrder: id, autoplayInterval: 1000, isActive: true, createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z' });
    const data = { mainHero: [fixture(1, 'MAIN_HERO'), fixture(2, 'MAIN_HERO')], bottomLeft: fixture(3, 'BOTTOM_LEFT'), bottomRight: fixture(4, 'BOTTOM_RIGHT'), sideLeft: fixture(5, 'SIDE_LEFT'), sideRightTop: fixture(6, 'SIDE_RIGHT_TOP'), sideRightMiddle: fixture(7, 'SIDE_RIGHT_MIDDLE'), sideRightBottom: fixture(8, 'SIDE_RIGHT_BOTTOM') };
    const empty = { mainHero: [], bottomLeft: null, bottomRight: null, sideLeft: null, sideRightTop: null, sideRightMiddle: null, sideRightBottom: null };
    const positions = ['MAIN_HERO', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'SIDE_LEFT', 'SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM'];
    const context = await browser.newContext();
    // Isolate banner geometry from the independently loaded product sections.
    await context.route('**/product-sections/home', route => route.fulfill({ json: { sections: [] } }));
    let payload = empty;
    let release;
    let hold = false;
    await context.route('**/banners/home', async route => { if (hold) await new Promise(resolve => { release = resolve; }); await route.fulfill({ json: payload }); });
    let sideRequests = 0;
    await context.route('**/media/banners/side-responsive.png', route => { sideRequests++; return route.fulfill({ contentType: 'image/png', body: png }); });
    await context.route('**/media/banners/responsive.png', route => route.fulfill({ contentType: 'image/png', body: png }));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const unfinishedFooterPaths = new Set(['/about', '/stores', '/blog', '/careers', '/partner', '/faq', '/guide', '/shipping', '/returns', '/support', '/policy/warranty', '/policy/return', '/policy/privacy', '/policy/terms', '/policy/payment']);
    page.on('console', message => {
      if (message.type() !== 'error') return;
      const url = new URL(message.location().url || base);
      // Production Link prefetches unrelated footer placeholders, which have no pages yet.
      if (message.text().includes('404') && url.searchParams.has('_rsc') && unfinishedFooterPaths.has(url.pathname)) return;
      errors.push(message.text());
    });
    async function boxes(target) {
      const result = {};
      for (const position of positions) { const slot = target.locator(`[data-banner-position="${position}"]`); result[position] = await slot.count() ? await slot.boundingBox() : null; }
      return result;
    }
    const heroRatio = width => width > 768 ? 16 / 7 : 2;
    const heroHeight = (width, boxWidth) => Math.min(boxWidth / heroRatio(width), width >= 1024 ? 440 : Infinity);
    async function geometry(width) {
      const b = await boxes(page);
      assert.equal(await page.locator('[data-banner-position]:visible').count(), width <= 768 ? 1 : 7);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: no overflow`);
      for (const box of Object.values(b).filter(Boolean)) assert.ok(box.width > 100 && box.height > 35 && box.x >= 0 && box.x + box.width <= width + 1);
      assert.ok(Math.abs(b.MAIN_HERO.height - heroHeight(width, b.MAIN_HERO.width)) < 1);
      for (const position of width > 768 ? ['BOTTOM_LEFT', 'BOTTOM_RIGHT'] : []) {
        assert.ok(Math.abs(b[position].width / b[position].height - 8 / (width >= 1024 ? 3.5 : 3)) < 0.02);
        assert.ok(b[position].height < b.MAIN_HERO.height);
      }
      if (width > 768) {
        assert.ok(Math.abs(b.BOTTOM_LEFT.y - b.BOTTOM_RIGHT.y) < 1);
        assert.ok(Math.abs(b.BOTTOM_LEFT.x - b.MAIN_HERO.x) < 1);
        assert.ok(Math.abs(b.BOTTOM_RIGHT.x + b.BOTTOM_RIGHT.width - b.MAIN_HERO.x - b.MAIN_HERO.width) < 1);
        assert.ok(Math.abs(b.BOTTOM_LEFT.y - b.MAIN_HERO.y - b.MAIN_HERO.height - (width >= 1024 ? 16 : 12)) < 1);
      }
      if (width <= 768) {
        assert.equal(b.BOTTOM_LEFT, null, 'Bottom slots stay hidden on mobile');
        assert.equal(b.BOTTOM_RIGHT, null);
        assert.equal(b.MAIN_HERO.x, 12);
        assert.equal(b.MAIN_HERO.width, width - 24);
        for (const position of positions.slice(3)) assert.equal(b[position], null);
      } else {
        assert.ok(b.SIDE_LEFT.x < b.MAIN_HERO.x && b.MAIN_HERO.x < b.SIDE_RIGHT_TOP.x);
        const end = b.BOTTOM_LEFT.y + b.BOTTOM_LEFT.height;
        assert.ok(Math.abs(b.SIDE_LEFT.height - (end - b.MAIN_HERO.y)) < 1);
        assert.ok(Math.abs(b.SIDE_RIGHT_BOTTOM.y + b.SIDE_RIGHT_BOTTOM.height - end) < 1);
      }

      return b;
    }
    for (const width of [320, 375, 390, 430, 440, 768, 769, 900, 1023, 1024, 1366, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      sideRequests = 0;
      hold = true; release = undefined; payload = data;
      await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
      await page.locator('[data-banner-position] .skeleton-shimmer:visible').first().waitFor();
      await page.waitForFunction(count => [...document.querySelectorAll('[data-banner-position]')].filter(el => el.getClientRects().length).length === count, width <= 768 ? 1 : 7);
      for (const position of width <= 768 ? positions.slice(0, 3) : positions) {
        assert.equal(await page.locator(`[data-banner-position="${position}"] .skeleton-shimmer`).count(), 1, `${width}px: ${position} has a loading skeleton`);
      }
      const loadingBoxes = await geometry(width);
      while (!release) await page.waitForTimeout(20);
      hold = false; release();
      await page.locator('[data-banner-position="MAIN_HERO"] img').waitFor();
      await page.locator('section[aria-label="Banner khuyến mãi"][aria-busy="false"]').waitFor();
      if (width <= 768) assert.equal(sideRequests, 0, `${width}px: no side media requests`);
      assert.deepEqual(await geometry(width), loadingBoxes, `${width}px: media does not move slots`);
      assert.equal(await page.locator('[data-banner-position="MAIN_HERO"] img').evaluate(element => getComputedStyle(element).objectFit), 'cover');
      console.log(`PASS ${width}px: new fixed-slot layout, media ratios, loading stability, no hidden-side requests`);
    }
    await page.setViewportSize({ width: 375, height: 900 });
    await page.screenshot({ path: path.join(directory, 'mobile.png'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(directory, 'desktop.png'), fullPage: true });
    // Empty hero removes the whole section, including padding. Home currently has no product list.
    for (const width of [375, 769, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      payload = { ...data, mainHero: [] }; await page.reload();
      await page.locator('section[aria-label="Banner khuyến mãi"]').waitFor({ state: 'detached' });
      assert.equal(await page.locator('[data-banner-position]').count(), 0);
      assert.equal(await page.locator('main .skeleton-shimmer').count(), 0);
      await page.evaluate(() => scrollTo(0, 0));
      const main = await page.locator('main').boundingBox();
      const header = await page.locator('header').boundingBox();
      const footer = await page.locator('footer').boundingBox();
      assert.equal(main.height, 0, 'No empty flex-grown banner area');
      assert.ok(Math.abs(footer.y - header.y - header.height) < 1, 'Following content moves up immediately');
    }
    console.log('PASS: missing hero hides all banners and removes all height/padding below Header');

    // Exercise every optional-slot combination, including all right-stack counts and single bottoms.
    const optional = ['sideLeft', 'sideRightTop', 'sideRightMiddle', 'sideRightBottom', 'bottomLeft', 'bottomRight'];
    const keys = { sideLeft: 'SIDE_LEFT', sideRightTop: 'SIDE_RIGHT_TOP', sideRightMiddle: 'SIDE_RIGHT_MIDDLE', sideRightBottom: 'SIDE_RIGHT_BOTTOM', bottomLeft: 'BOTTOM_LEFT', bottomRight: 'BOTTOM_RIGHT' };
    for (const width of [375, 769, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (let mask = 0; mask < 64; mask++) {
        payload = { ...data, mainHero: [data.mainHero[0]] };
        for (const [bit, key] of optional.entries()) if (!(mask & (1 << bit))) payload[key] = null;
        const response = page.waitForResponse('**/banners/home');
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await response;
        const expected = ['MAIN_HERO', ...(width > 768 ? optional.filter(key => payload[key]).map(key => keys[key]) : [])].sort();
        await page.waitForFunction(expected => JSON.stringify([...document.querySelectorAll('[data-banner-position]')].filter(el => el.getClientRects().length).map(el => el.dataset.bannerPosition).sort()) === JSON.stringify(expected), expected);
        const b = await boxes(page);
        assert.equal(await page.locator('main .skeleton-shimmer').count(), 0);
        assert.equal(await page.locator('[aria-roledescription="carousel"] button').count(), 0, 'Single hero has no carousel controls');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const bottomBoxes = ['BOTTOM_LEFT', 'BOTTOM_RIGHT'].map(key => b[key]).filter(Boolean);
        const hero = b.MAIN_HERO;
        const end = bottomBoxes.length ? bottomBoxes[0].y + bottomBoxes[0].height : hero.y + hero.height;
        for (const bottom of bottomBoxes) assert.ok(bottom.height < hero.height);
        if (bottomBoxes.length === 1) assert.ok(Math.abs(bottomBoxes[0].width - hero.width) < 1, 'Single bottom spans full main width');
        if (width > 768) {
          if (b.SIDE_LEFT) assert.ok(Math.abs(b.SIDE_LEFT.height - (end - hero.y)) < 1, 'Left spans hero plus bottoms');
          const right = ['SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM'].map(key => b[key]).filter(Boolean);
          if (right.length) {
            assert.ok(Math.abs(right.at(-1).y + right.at(-1).height - end) < 1);
            for (const box of right) assert.ok(Math.abs(box.height - right[0].height) < 1);
          }
        }
        if (width <= 768 || (!payload.sideLeft && !payload.sideRightTop && !payload.sideRightMiddle && !payload.sideRightBottom)) {
          const section = await page.locator('section[aria-label="Banner khuyến mãi"]').boundingBox();
          assert.ok(Math.abs(hero.width - section.width + (width >= 1024 ? 32 : 24)) < 1, 'Main expands into absent side columns');
        }
      }
      console.log(`PASS ${width}px: all 64 optional-slot combinations; no placeholders, full-height sides, adaptive columns and bottoms`);
    }
    // Focused hero-only check: the section must collapse to the compact hero plus its existing padding.
    payload = { ...empty, mainHero: [data.mainHero[0]] };
    for (const width of [1440, 1366, 1024, 768, 430, 390, 1920]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(base + '/');
      await page.locator('[data-banner-position="MAIN_HERO"] img.opacity-100').waitFor();
      await page.waitForFunction(() => document.querySelectorAll('[data-banner-position]').length === 1);
      const hero = await page.locator('[data-banner-position="MAIN_HERO"]').boundingBox();
      const section = page.locator('section[aria-label="Banner \u006b\u0068\u0075\u0079\u1ebf\u006e \u006d\u00e3\u0069"]');
      const sectionBox = await section.boundingBox();
      const padding = await section.evaluate(el => { const style = getComputedStyle(el); return parseFloat(style.paddingTop) + parseFloat(style.paddingBottom); });
      assert.ok(Math.abs(hero.height - heroHeight(width, hero.width)) < 1);
      assert.ok(Math.abs(sectionBox.height - hero.height - padding) < 1, 'No retained grid height or extra whitespace');
      if (width >= 1024) assert.ok(hero.height <= 440, 'Desktop hero respects existing height cap');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const mediaBox = await page.locator('[data-banner-position="MAIN_HERO"] img').boundingBox();
      assert.deepEqual(mediaBox, hero);
      console.log(`PASS hero-only ${width}px: ${hero.width} x ${hero.height}, correct ratio/cap, no retained grid height`);
    }
    await context.close();

    // Isolate media loading from API loading: the data is ready while bytes are held.
    const loadingContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    let allowImage = false;
    const imageReleases = [];
    await loadingContext.route('**/banners/home', route => route.fulfill({ json: { ...data, mainHero: [data.mainHero[0]], bottomLeft: null } }));
    await loadingContext.route('**/media/banners/side-responsive.png', route => route.fulfill({ contentType: 'image/png', body: png }));
    await loadingContext.route('**/media/banners/responsive.png', async route => {
      if (!allowImage) await new Promise(resolve => imageReleases.push(resolve));
      await route.fulfill({ contentType: 'image/png', body: png });
    });
    const loadingPage = await loadingContext.newPage();
    await loadingPage.goto(base + '/', { waitUntil: 'domcontentloaded' });
    const loadingSlot = loadingPage.locator('[data-banner-position="MAIN_HERO"]');
    await loadingSlot.locator('img').waitFor({ state: 'attached' });
    assert.equal(await loadingSlot.locator('.skeleton-shimmer').count(), 0, 'Data loaded: no skeleton while image bytes are pending');
    const beforeImage = await loadingSlot.boundingBox();
    while (!imageReleases.length) await loadingPage.waitForTimeout(20);
    allowImage = true; imageReleases.forEach(resolve => resolve());
    await loadingSlot.locator('img.opacity-100').waitFor();
    assert.equal(await loadingSlot.locator('.skeleton-shimmer').count(), 0);
    assert.deepEqual(await loadingSlot.boundingBox(), beforeImage);
    await loadingContext.close();
    console.log('PASS: media loading keeps reserved geometry without a skeleton after API data is ready');

    const sideContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const sideSlides = Object.fromEntries(positions.slice(1).map((position, i) => [position, [fixture(20 + i * 2, position), fixture(21 + i * 2, position)]]));
    await sideContext.route('**/banners/home', route => route.fulfill({ json: { ...data, sideSlides } }));
    await sideContext.route('**/media/banners/*.png', route => route.fulfill({ contentType: 'image/png', body: png }));
    const sidePage = await sideContext.newPage();
    await sidePage.goto(base + '/');
    for (const position of positions.slice(1)) {
      const slider = sidePage.locator(`[data-banner-position="${position}"] [aria-roledescription="carousel"]`);
      const slide = slider.locator('[aria-roledescription="slide"]');
      const before = await slide.getAttribute('aria-label');
      assert.ok(before.includes('/ 2:'));
      await sidePage.waitForFunction(({position, previous}) => document.querySelector(`[data-banner-position="${position}"] [aria-roledescription="slide"]`).getAttribute('aria-label') !== previous, { position, previous: before }, { timeout: 3000 });
      assert.equal(await slider.locator('button[aria-current]').count(), 1);
    }
    await sidePage.setViewportSize({ width: 390, height: 844 });
    await sidePage.waitForFunction(() => [...document.querySelectorAll('[data-banner-position]')].filter(el => el.getClientRects().length).length === 1);
    assert.equal(await sidePage.locator('[aria-roledescription="carousel"]:visible').count(), 1);
    console.log('PASS: all six side slots autoplay multiple images; mobile displays only the main slider');
    await sideContext.close();

    // Use actual Chromium touch input, not synthetic pointer handlers.
    const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await touchContext.route('**/banners/home', route => route.fulfill({ json: { ...data, mainHero: data.mainHero.map(banner => ({ ...banner, autoplayInterval: 10000 })) } }));
    await touchContext.route('**/media/banners/responsive.png', route => route.fulfill({ contentType: 'image/png', body: png }));
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror', error => errors.push(error.message));
    await touchPage.goto(base + '/');
    const cdp = await touchContext.newCDPSession(touchPage);
    const dispatch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
    for (const label of ['Banner chính']) {
      const slider = touchPage.getByRole('region', { name: label, exact: true });
      await slider.scrollIntoViewIfNeeded();
      await touchPage.getByRole('button', { name: `${label}: chọn banner 1`, exact: true }).click();
      const box = await slider.boundingBox();
      const current = () => slider.locator('[aria-roledescription="slide"]').getAttribute('aria-label');
      const original = await current();
      const y = box.y + box.height / 2;
      assert.equal(await touchPage.getByRole('button', { name: `${label}: banner tiếp theo` }).isVisible(), false);
      await dispatch('touchStart', box.x + box.width * 0.8, y);
      await dispatch('touchMove', box.x + box.width * 0.5, y);
      await dispatch('touchMove', box.x + box.width * 0.2, y);
      await dispatch('touchEnd');
      await touchPage.waitForTimeout(100);
      assert.notEqual(await current(), original, 'Swipe left advances');
      assert.equal(new URL(touchPage.url()).pathname, '/', 'Swipe does not navigate banner link');
      await dispatch('touchStart', box.x + box.width * 0.2, y);
      await dispatch('touchMove', box.x + box.width * 0.8, y);
      await dispatch('touchEnd');
      await touchPage.waitForTimeout(100);
      assert.equal(await current(), original, 'Swipe right goes back and loops');
      await touchPage.locator('header').click({ position: { x: 5, y: 5 } });
      await touchPage.waitForTimeout(10150);
      assert.notEqual(await current(), original, 'Autoplay resumes on touch device');
      console.log(`PASS touch ${label}: swipe in both directions, hidden arrows, autoplay, no accidental link navigation`);
    }
    const bottom = touchPage.getByRole('region', { name: 'Banner chính', exact: true });
    await bottom.scrollIntoViewIfNeeded();
    await touchPage.getByRole('button', { name: 'Banner chính: chọn banner 1', exact: true }).click();
    const bottomBox = await bottom.boundingBox();
    const beforeVertical = await bottom.locator('[aria-roledescription="slide"]').getAttribute('aria-label');
    const scrollBefore = await touchPage.evaluate(() => scrollY);
    await dispatch('touchStart', bottomBox.x + bottomBox.width / 2, bottomBox.y + bottomBox.height * 0.8);
    await dispatch('touchMove', bottomBox.x + bottomBox.width / 2, bottomBox.y + bottomBox.height * 0.4);
    await dispatch('touchMove', bottomBox.x + bottomBox.width / 2, bottomBox.y + bottomBox.height * 0.1);
    await dispatch('touchEnd');
    await touchPage.waitForTimeout(200);
    assert.equal(await bottom.locator('[aria-roledescription="slide"]').getAttribute('aria-label'), beforeVertical);
    assert.ok(await touchPage.evaluate(before => scrollY > before, scrollBefore), 'Vertical swipe scrolls page');
    await touchPage.evaluate(() => scrollTo(0, 0)); // Keep the hero clear of the sticky header before tapping.
    await touchPage.waitForTimeout(800); // Allow native touch-scroll inertia to finish before tapping.
    const tapBox = await bottom.boundingBox();
    await touchPage.touchscreen.tap(tapBox.x + tapBox.width / 2, tapBox.y + tapBox.height / 2);
    await touchPage.waitForURL('**/customer/products');
    console.log('PASS touch: vertical scrolling is preserved; a normal tap still follows the banner link');

    if (process.env.BANNER_TEST_VIDEO) {
      const bytes = await fs.readFile(process.env.BANNER_TEST_VIDEO);
      await touchContext.unroute('**/banners/home');
      await touchContext.route('**/banners/home', route => route.fulfill({ json: { ...data, mainHero: [{ ...data.mainHero[0], mediaType: 'VIDEO', mediaUrl: '/media/banners/responsive.webm' }] } }));
      await touchContext.route('**/media/banners/responsive.webm', route => route.fulfill({ contentType: 'video/webm', body: bytes }));
      await touchPage.goto(base + '/');
      const video = touchPage.locator('[data-banner-position="MAIN_HERO"] video');
      await video.waitFor();
      await video.evaluate(element => new Promise((resolve, reject) => { if (element.readyState >= 2) return resolve(); element.addEventListener('loadeddata', resolve, { once: true }); element.addEventListener('error', reject, { once: true }); }));
      assert.ok(await video.evaluate(element => element.autoplay && element.muted && element.playsInline && getComputedStyle(element).objectFit === 'cover'));
      const slotBox = await touchPage.locator('[data-banner-position="MAIN_HERO"]').boundingBox();
      assert.deepEqual(await video.boundingBox(), slotBox);
      assert.ok(Math.abs(slotBox.width / slotBox.height - 2) < 0.02);
      console.log('PASS touch: actual responsive video playback fits the reserved 2:1 slot');
    }
    await touchContext.close();
    assert.deepEqual(errors, []);
    console.log('Screenshots:', directory);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
