const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const screenshots = await fs.mkdtemp(path.join(os.tmpdir(), 'home-products-'));
  const base = process.env.TEST_URL || 'http://localhost:3000';
  const errors = [];
  const product = id => ({ id, name: id === 1 ? 'PC Gaming Intel Core i5 RTX 4060 RAM 16GB SSD 512GB với tên sản phẩm dài để kiểm tra giới hạn hai dòng' : `PC Gaming ${id}`, price: 18090000 + id * 100000, primaryImage: id === 2 ? null : '/test-product.svg' });
  const detailedProduct = id => ({
    ...product(id),
    ...(id === 1 ? { originalPrice: 20620000, specifications: [
      { name: 'PSU', value: '650W' },
      { name: 'CPU', value: 'Intel Core i5-12400F' }, { name: 'Mainboard', value: 'H610M' },
      { name: 'RAM', value: '16 GB' }, { name: 'SSD', value: '512 GB' },
      { name: 'GPU', value: 'RTX 3050 6GB' },
    ], promotion: 'Tặng bàn phím và chuột gaming' } : {}),
    ...(id === 4 ? { specifications: [{ name: 'CPU', value: 'Intel i5' }, { name: 'RAM', value: '16 GB' }, { name: 'SSD', value: '512 GB' }], originalPrice: product(id).price } : {}),
    ...(id === 5 ? { originalPrice: 1000000, promotion: ' ' } : {}),
    ...(id === 6 ? { specifications: [{ name: 'CPU', value: ' ' }] } : {}),
    ...(id === 7 ? { specifications: [
      { name: 'Operating system', value: 'Windows 11' }, { name: 'Graphics', value: 'RTX 4060' },
      { name: 'Storage', value: '1 TB' }, { name: 'Memory', value: '32 GB' },
      { name: 'Motherboard', value: 'B760' }, { name: 'Processor', value: 'Intel i7' },
    ] } : {}),
  });
  const section = (id, count, subtitle = null) => ({ id, name: `PC bán chạy ${id}`, subtitle, viewAllUrl: '/customer/products', products: Array.from({ length: count }, (_, i) => detailedProduct(i + 1)) });
  let payload = { sections: [section(7, 8, 'Tặng màn hình 240Hz'), section(3, 3), section(9, 0)] };
  let hold = false;
  let release;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  try {
    await context.route('**/product-sections/home', async route => {
      if (hold) await new Promise(resolve => { release = resolve; });
      await route.fulfill({ json: payload });
    });
    await context.route('**/banners/home', route => route.fulfill({ json: { mainHero: [{ id: 1, name: 'Banner hiện tại', position: 'MAIN_HERO', mediaType: 'IMAGE', mediaUrl: '/test-hero.svg', isActive: true, sortOrder: 0, autoplayInterval: 4500 }], sideSlides: {} } }));
    await context.route('**/test-hero.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="700"><rect width="1600" height="700" fill="#e2e8f0"/><text x="800" y="380" text-anchor="middle" font-size="80" fill="#475569">BANNER</text></svg>' }));
    await context.route('**/test-product.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="350" height="500"><rect x="80" y="25" width="190" height="450" rx="20" fill="#0f172a"/><circle cx="175" cy="130" r="55" fill="#f97316"/><circle cx="175" cy="280" r="55" fill="#ea580c"/></svg>' }));
    await page.goto(base);
    await page.locator('#home-products-7').waitFor();
    assert.deepEqual(await page.locator('h2[id^="home-products-"]').allTextContents(), ['PC bán chạy 7', 'PC bán chạy 3'], 'Keep API ordering and omit empty sections');
    const first = page.locator('section[aria-labelledby="home-products-7"]');
    const second = page.locator('section[aria-labelledby="home-products-3"]');
    const track = first.getByRole('region');
    assert.equal(await first.locator('article').first().getByRole('list', { name: 'Thông số nổi bật' }).locator('li').count(), 5, 'Only five specifications');
    assert.equal(await first.locator('article').first().getByText('650W', { exact: true }).count(), 0);
    assert.equal(await first.locator('article').first().getByText('Giảm 12%', { exact: true }).count(), 1);
    assert.equal(await first.locator('article').first().locator('del').textContent(), '20.620.000đ');
    assert.equal(await first.locator('article').nth(3).locator('del').count(), 0, 'Equal prices are not a discount');
    assert.equal(await first.locator('article').nth(4).locator('del').count(), 0, 'Lower original price is not a discount');
    assert.equal(await first.locator('article').nth(5).getByRole('list').count(), 0, 'No blank specifications frame');
    assert.deepEqual(await first.locator('article').nth(6).getByRole('list').locator('li').evaluateAll(items => items.map(item => item.title)), ['Processor: Intel i7', 'Motherboard: B760', 'Memory: 32 GB', 'Storage: 1 TB', 'Graphics: RTX 4060'], 'Prefer important specification aliases over less relevant fields');
    for (const width of [1920, 1536, 1440, 1366, 1024, 768, 430, 390, 320]) {
      await page.setViewportSize({ width, height: 1100 });
      await track.evaluate(el => { el.scrollLeft = 0; });
      await page.mouse.move(0, 0);
      await page.waitForTimeout(100);
      const geometry = await first.evaluate(el => {
        const banner = document.querySelector('section[aria-label="Banner khuyến mãi"] > div').getBoundingClientRect();
        const section = el.getBoundingClientRect();
        const track = el.querySelector('[role="region"]');
        const cards = [...track.querySelectorAll('article')].map(card => card.getBoundingClientRect());
        const image = el.querySelector('article img');
        const imageBox = image.parentElement.getBoundingClientRect();
        const heading = el.querySelector('h3');
        const specs = el.querySelector('article ul');
        const style = getComputedStyle(specs);
        return { section: { x: section.x, width: section.width }, banner: { x: banner.x, width: banner.width }, gap: section.y - banner.bottom, overflow: document.documentElement.scrollWidth - innerWidth, cards: cards.map(c => ({ x: c.x, y: c.y, width: c.width, height: c.height })), visible: cards.filter(c => c.right <= track.getBoundingClientRect().right + 1 && c.left >= track.getBoundingClientRect().left - 1).length, imageFraction: imageBox.height / cards[0].height, imageAspect: imageBox.width / imageBox.height, sameImages: [...el.querySelectorAll('article > div:first-child')].every(frame => Math.abs(frame.getBoundingClientRect().height - imageBox.height) < 1), fit: getComputedStyle(image).objectFit, position: getComputedStyle(image).objectPosition, nameHeight: heading.getBoundingClientRect().height, visibleSpecs: [...specs.querySelectorAll('li')].filter(item => getComputedStyle(item).display !== 'none').length, specStyle: { background: style.backgroundColor, radius: style.borderRadius, padding: style.padding }, contentFits: [...el.querySelectorAll('article > div:last-child')].every(content => content.scrollHeight <= content.clientHeight + 1 && content.scrollWidth <= content.clientWidth + 1) };
      });
      assert.ok(Math.abs(geometry.section.x - geometry.banner.x) < 1 && Math.abs(geometry.section.width - geometry.banner.width) < 1, `Banner alignment ${width}`);
      assert.ok(geometry.overflow <= 1, `No page overflow ${width}: ${JSON.stringify(geometry)}`);
      assert.equal(geometry.fit, 'contain');
      assert.equal(geometry.position, '50% 50%');
      if (width < 640) assert.ok(Math.abs(geometry.imageAspect - 1) < 0.02, `Square mobile image ${width}: ${geometry.imageAspect}`);
      else assert.ok(geometry.imageFraction >= 0.45 && geometry.imageFraction <= 0.5, `Image occupies half the card ${width}: ${geometry.imageFraction}`);
      assert.ok(geometry.nameHeight <= 45, `Two-line name ${width}`);
      assert.ok(geometry.cards.every(card => card.height > card.width && card.height <= 620 && Math.abs(card.height - geometry.cards[0].height) < 1 && Math.abs(card.y - geometry.cards[0].y) < 1), `Uniform vertical cards ${width}: ${JSON.stringify(geometry.cards)}`);
      assert.ok(geometry.cards.every(card => card.width <= 240.5), `Card width never exceeds 240px at ${width}px`);
      assert.ok(geometry.contentFits, `Content fits ${width}`);
      assert.ok(geometry.sameImages, `Image frames have the same height ${width}`);
      assert.deepEqual(geometry.specStyle, width < 640
        ? { background: 'rgb(245, 245, 245)', radius: '8px', padding: '6px' }
        : { background: 'rgb(245, 245, 245)', radius: '10px', padding: '10px' });
      assert.equal(geometry.visible, width >= 1280 ? 5 : width >= 1024 ? 4 : width >= 640 ? 3 : 2);
      if (width < 640) assert.equal(geometry.visibleSpecs, 3, `Three mobile specifications ${width}`);
      if (width >= 1024) assert.ok(geometry.gap >= 24 && geometry.gap <= 32);
      const previous = first.getByRole('button', { name: /^Sản phẩm trước/ });
      const next = first.getByRole('button', { name: /^Sản phẩm tiếp theo/ });
      assert.equal(await next.isVisible(), width >= 768);
      if (width >= 768) {
        assert.equal(await previous.isDisabled(), true);
        await next.click();
        await page.waitForFunction(() => document.querySelector('section[aria-labelledby="home-products-7"] [role="region"]').scrollLeft > 50);
        await page.waitForTimeout(350);
        assert.equal(await previous.isEnabled(), true);
        await previous.click();
        await page.waitForFunction(() => document.querySelector('section[aria-labelledby="home-products-7"] [role="region"]').scrollLeft < 1);
        assert.equal(await second.getByRole('button').count(), 0, 'No unnecessary arrows for three cards');
      }
      if ([1440, 768, 390].includes(width)) await page.screenshot({ path: path.join(screenshots, `${width}.png`), fullPage: true });
      console.log(`PASS ${width}px: aligned, uniform vertical cards (${Math.round(geometry.cards[0].height)}px), image ${Math.round(geometry.imageFraction * 100)}%, specs box, no page overflow`);
    }

    await page.setViewportSize({ width: 390, height: 1100 });
    await track.scrollIntoViewIfNeeded();
    await track.evaluate(el => { el.scrollLeft = 0; });
    const box = await track.boundingBox();
    const cdp = await context.newCDPSession(page);
    const y = box.y + 90;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + box.width - 25, y }] });
    for (let step = 1; step <= 8; step++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + box.width - 25 - step * 25, y }] });
      await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForFunction(() => document.querySelector('section[aria-labelledby="home-products-7"] [role="region"]').scrollLeft > 50);
    console.log('PASS mobile: native touch swipe scrolls product row');

    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.waitForTimeout(500);
    await track.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    await page.waitForFunction(() => {
      const el = document.querySelector('section[aria-labelledby="home-products-7"] [role="region"]');
      return el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    });
    await page.waitForTimeout(50);
    assert.equal(await first.getByRole('button', { name: /^Sản phẩm tiếp theo/ }).isDisabled(), true, 'Next disabled at end');
    const a = await first.boundingBox();
    const b = await second.boundingBox();
    assert.ok(b.y - (a.y + a.height) >= 20 && b.y - (a.y + a.height) <= 28, 'Section spacing');

    payload = { sections: [section(7, 1)] };
    payload.sections[0].products = [product(1)];
    await page.reload();
    await page.locator('#home-products-7').waitFor();
    assert.equal(await first.locator('article').count(), 1);
    assert.equal(await first.getByRole('button').count(), 0);
    assert.equal(await first.locator('p').count(), 1, 'No phantom subtitle or promotion');
    assert.equal(await first.getByRole('link', { name: /Xem tất cả/ }).getAttribute('href'), '/customer/products');
    console.log('PASS single product: no extra cards, arrows or empty subtitle/promotion');

    await page.setViewportSize({ width: 390, height: 1100 });
    hold = true;
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.getByText('Đang tải sản phẩm', { exact: true }).waitFor();
    const loadingHeight = await page.getByText('Đang tải sản phẩm', { exact: true }).evaluate(el => el.parentElement.getBoundingClientRect().height);
    assert.ok(loadingHeight <= 380, `Compact loading skeleton: ${loadingHeight}`);
    await page.waitForFunction(() => document.querySelector('[aria-busy="true"] .skeleton-shimmer'));
    while (!release) await page.waitForTimeout(20);
    hold = false;
    release();
    await page.locator('#home-products-7').waitFor();
    assert.equal(await page.getByText('Đang tải sản phẩm', { exact: true }).count(), 0);
    assert.equal(await first.locator('.skeleton-shimmer').count(), 0);
    payload = { sections: [] };
    await page.reload();
    await page.waitForFunction(() => !document.querySelector('[class*="HomeProductSections_sections"]'));
    console.log('PASS loading/empty: compact skeleton disappears, no empty frame');
    assert.deepEqual(errors, []);
    console.log(`Screenshots: ${screenshots}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
