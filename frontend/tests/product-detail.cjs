const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const backend = path.resolve(__dirname, '../../backend');
require(path.join(backend, 'node_modules/dotenv')).config({ path: path.join(backend, '.env') });
const base = process.env.TEST_URL || 'http://localhost:3000';

(async () => {
  const { prisma } = await import(pathToFileURL(path.join(backend, 'src/config/prisma.js')));
  const marker = `detail-ui-${randomUUID().slice(0, 8)}`;
  const artifacts = path.resolve(__dirname, '../../docs/product-detail-screenshots'); fs.mkdirSync(artifacts, { recursive: true });
  let browser, category, brand, product, empty, section;
  try {
    const source = await prisma.productImage.findMany({ take: 2, select: { imageUrl: true } });
    const firstImage = source[0]?.imageUrl || `/media/products/${marker}-first.svg`;
    const secondImage = source[1]?.imageUrl || `${firstImage}?second`;
    category = await prisma.category.create({ data: { name: 'Máy tính để bàn kiểm thử', slug: `legacy-${marker}-category` } });
    brand = await prisma.brand.create({ data: { name: 'Thương hiệu kiểm thử', slug: `legacy-${marker}-brand` } });
    product = await prisma.product.create({ data: { name: 'PC DUCMANH Ryzen 7 • 32GB DDR5 • RTX 5070', slug: `${marker}-pc`, sku: marker.toUpperCase(), category: 'outdated category', categoryId: category.id, brand: 'outdated brand', brandId: brand.id,
      price: 16000000, originalPrice: 20000000, stockQuantity: 3, shortDescription: 'Cấu hình cân bằng cho công việc và chơi game.', description: 'Mô tả lấy từ database.\n' + 'Nội dung chi tiết sản phẩm, dễ đọc trên mọi thiết bị. '.repeat(40) + '<script>window.productDescriptionExecuted=true</script>',
      images: { create: [{ imageUrl: secondImage, altText: 'Góc nhìn thứ hai', sortOrder: 0 }, { imageUrl: firstImage, altText: 'Ảnh sản phẩm chính', sortOrder: 5, isPrimary: true }, ...[3, 4, 5, 6, 7].map(index => ({ imageUrl: `${firstImage}?angle=${index}`, altText: `Góc nhìn ${index}`, sortOrder: index + 10 }))] },
      specifications: { create: [{ name: 'Màu sắc', value: 'Đen', sortOrder: 0 }, { name: 'CPU', value: 'Ryzen 7 7800X3D', sortOrder: 1 }, { name: 'RAM', value: '32GB DDR5', sortOrder: 2 }, { name: 'GPU', value: 'RTX 5070', sortOrder: 3 }, { name: 'SSD', value: '1TB NVMe', sortOrder: 4 }, { name: 'Mainboard', value: 'B650', sortOrder: 5 }, { name: 'Nguồn', value: '850W', sortOrder: 6 }, { name: 'Kích thước', value: 'Giá trị thông số dài\nDòng thứ hai ' + 'x'.repeat(180), sortOrder: 7 }] },
    } });
    empty = await prisma.product.create({ data: { name: `${marker} Hết hàng`, slug: `${marker}-empty`, sku: `${marker}-EMPTY`, price: 1000000, stockQuantity: 0 } });
    section = await prisma.productSection.create({ data: { name: `${marker} Section`, slug: marker, items: { create: { productId: product.id } } } });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    // Only used when the workspace has no uploaded images.
    await context.route(`**/${marker}-first.svg*`, route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect x="100" y="40" width="200" height="320" rx="12" fill="#334155"/><circle cx="200" cy="140" r="55" fill="#fb923c"/><circle cx="200" cy="270" r="55" fill="#f97316"/></svg>' }));
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(15000);
    await page.goto(`${base}/customer/products?search=${encodeURIComponent(product.name)}`);
    await page.getByRole('link', { name: `Xem chi tiết ${product.name}`, exact: true }).click();
    await page.waitForURL(`${base}/products/${product.slug}`);
    await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
    assert.equal(await page.getByTestId('product-brand').innerText(), brand.name);
    assert.equal(await page.getByTestId('product-category').innerText(), category.name);
    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true }); assert.ok((await breadcrumb.innerText()).includes(category.name)); assert.ok(!(await breadcrumb.innerText()).includes('legacy-'));
    const pricing = page.getByTestId('product-pricing'); await pricing.getByText('16.000.000đ', { exact: true }).waitFor(); assert.ok((await pricing.locator('del').innerText()).includes('20.000.000đ')); await pricing.getByText('Giảm 20%', { exact: true }).waitFor();
    const statistics = page.getByTestId('product-statistics');
    const statsCells = statistics.locator(':scope > div');
    await statistics.getByRole('button', { name: 'Xem 0 đánh giá sản phẩm', exact: true }).waitFor();
    await statistics.getByText('Mã SP:', { exact: true }).waitFor();
    await statistics.getByText(product.sku, { exact: true }).waitFor();
    assert.equal(await statsCells.nth(2).locator('dd').innerText(), '0 Bình luận', 'No fabricated comment count');
    await page.waitForFunction(() => document.querySelector('[data-testid="product-statistics"] > div:last-child dd')?.textContent === '1 Lượt xem');
    assert.equal(await prisma.productView.count({ where: { productId: product.id } }), 1, 'First successful page visit persists exactly one view, including StrictMode');
    const mainImage = page.getByTestId('product-main-image').locator('img'); assert.equal(await mainImage.getAttribute('alt'), 'Ảnh sản phẩm chính');
    const primaryImageSrc = await mainImage.getAttribute('src');
    assert.equal(await mainImage.evaluate(el => getComputedStyle(el).objectFit), 'contain');
    await page.getByRole('button', { name: 'Xem ảnh 2', exact: true }).click(); assert.equal(await mainImage.getAttribute('alt'), 'Góc nhìn thứ hai');
    await page.getByRole('button', { name: 'Xem ảnh 1', exact: true }).click();
    const highlights = page.getByRole('region', { name: 'Thông số nổi bật', exact: true }); assert.equal(await highlights.locator('dt').count(), 6);
    assert.equal(await page.getByRole('table').locator('tr').count(), 8); assert.ok((await page.getByRole('table').innerText()).includes('Ryzen 7 7800X3D'));
    assert.deepEqual(await page.getByRole('table').locator('th').allTextContents(), ['Màu sắc', 'CPU', 'RAM', 'GPU', 'SSD', 'Mainboard', 'Nguồn', 'Kích thước'], 'Specifications follow database sortOrder');
    assert.ok((await page.getByRole('table').locator('td').last().innerText()).includes('Giá trị thông số dài\nDòng thứ hai'), 'Multiline specification retains line breaks');
    await page.getByRole('button', { name: 'Xem thêm', exact: true }).click(); await page.getByRole('button', { name: 'Thu gọn', exact: true }).waitFor(); assert.equal(await page.evaluate(() => Boolean(window.productDescriptionExecuted)), false, 'Description is rendered as text, not executed HTML');
    await page.reload(); await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
    const detailNavigation = page.getByRole('navigation', { name: 'Nội dung chi tiết sản phẩm', exact: true });
    const destinations = [
      ['Hình ảnh sản phẩm', 'product-gallery'], ['Thông số kỹ thuật', 'product-specifications'],
      ['Câu hỏi thường gặp', 'product-faq'], ['Đánh giá sản phẩm', 'product-reviews'],
    ];
    assert.equal(await detailNavigation.getByRole('link').count(), 4);
    assert.equal(await detailNavigation.locator('svg').count(), 3);
    const menuImage = detailNavigation.getByRole('link', { name: 'Hình ảnh sản phẩm', exact: true }).locator('img');
    assert.equal(await menuImage.getAttribute('src'), primaryImageSrc, 'Menu uses current product primary image');
    assert.equal(await menuImage.evaluate(element => getComputedStyle(element).objectFit), 'contain');
    let detailReloads = 0;
    const trackReload = frame => { if (frame === page.mainFrame()) detailReloads++; };
    page.on('framenavigated', trackReload);
    for (const [label, id] of destinations) {
      const link = detailNavigation.getByRole('link', { name: label, exact: true });
      assert.equal(await link.getAttribute('href'), `#${id}`);
      await link.click();
      assert.equal(await link.getAttribute('aria-current'), 'location');
      assert.equal(await detailNavigation.locator('[aria-current="location"]').count(), 1);
      await page.waitForFunction(target => document.activeElement?.id === target, id);
      await page.waitForFunction(target => {
        const section = document.getElementById(target).getBoundingClientRect();
        const header = document.querySelector('header').getBoundingClientRect();
        return section.top >= header.bottom - 1 && section.top < innerHeight;
      }, id);
    }
    page.off('framenavigated', trackReload);
    assert.equal(detailReloads, 0, 'Detail navigation scrolls without reloading or changing routes');
    assert.equal(page.url(), `${base}/products/${product.slug}`);
    const sectionIds = await page.getByTestId('product-detail').locator('section[id]').evaluateAll(sections => sections.map(section => section.id));
    assert.deepEqual(sectionIds, ['product-description', 'product-specifications', 'product-faq', 'product-reviews']);
    assert.equal(await page.locator('#product-images').count(), 0, 'No duplicate image section below the gallery');
    assert.equal(await page.getByRole('heading', { name: 'Hình ảnh sản phẩm', exact: true }).count(), 0);
    assert.equal(await page.getByRole('region', { name: 'Ảnh sản phẩm', exact: true }).count(), 1, 'Only one product gallery');
    assert.equal(await page.locator('#product-gallery img').count(), 8, 'One main image and seven thumbnails');
    const galleryCaption = page.getByText('Hình ảnh mang tính chất minh họa / tham khảo !', { exact: true });
    assert.equal(await galleryCaption.evaluate(element => getComputedStyle(element).fontStyle), 'italic');
    assert.equal(await galleryCaption.evaluate(element => getComputedStyle(element).textAlign), 'center');
    await page.getByText('Chưa có câu hỏi thường gặp cho sản phẩm này.', { exact: true }).waitFor();
    await page.getByText('Chưa có đánh giá cho sản phẩm này.', { exact: true }).waitFor();
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(100); await page.screenshot({ path: path.join(artifacts, 'desktop.png'), fullPage: true });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px no horizontal overflow`);
      const gallery = await page.getByRole('region', { name: 'Ảnh sản phẩm', exact: true }).boundingBox();
      const title = await page.getByRole('heading', { name: product.name, exact: true }).boundingBox();
      const lowerDescription = await page.locator('#product-description').boundingBox();
      const lowerSpecifications = await page.locator('#product-specifications').boundingBox();
      if (width >= 1024) {
        assert.ok(lowerSpecifications.x >= lowerDescription.x + lowerDescription.width, `${width}px specifications are on the right`);
        assert.ok(Math.abs(lowerDescription.width / lowerSpecifications.width - 1.5) < 0.01, `${width}px lower content uses 3:2 columns`);
        assert.ok(Math.abs(lowerSpecifications.y - lowerDescription.y) < 1, `${width}px lower content cards align at top`);
      } else {
        assert.ok(lowerSpecifications.y >= lowerDescription.y + lowerDescription.height, `${width}px description precedes specifications in one column`);
        assert.ok(Math.abs(lowerDescription.width - lowerSpecifications.width) < 1, `${width}px lower cards share one column width`);
      }
      const statsBounds = await statistics.boundingBox();
      const specsBounds = await highlights.boundingBox();
      const priceBounds = await pricing.boundingBox();
      assert.ok(statsBounds.y > title.y + title.height && specsBounds.y >= statsBounds.y + statsBounds.height && specsBounds.y - statsBounds.y - statsBounds.height <= 20, `${width}px statistics and highlights directly follow product title`);
      assert.ok(specsBounds.y + specsBounds.height < priceBounds.y, `${width}px highlights precede price and purchase actions`);
      const cellBounds = await statsCells.evaluateAll(cells => cells.map(cell => cell.getBoundingClientRect().top));
      if (width >= 640) assert.ok(cellBounds.every(y => Math.abs(y - cellBounds[0]) < 1), `${width}px statistics stay in one row`);
      const statItems = await statsCells.evaluateAll(cells => cells.map(cell => {
        const icon = cell.querySelector('svg').getBoundingClientRect();
        const label = cell.querySelector('span').getBoundingClientRect();
        return { iconWidth: icon.width, sameLine: Math.abs(icon.y + icon.height / 2 - label.y - label.height / 2) < 1 };
      }));
      assert.ok(statItems.every(item => item.iconWidth === 16 && item.sameLine), `${width}px 16px icons and labels stay horizontally aligned within each statistic`);
      const menu = await detailNavigation.boundingBox();
      const caption = await galleryCaption.boundingBox();
      assert.ok(Math.abs(caption.y - gallery.y - gallery.height - 8) < 1, `${width}px small gap from gallery to caption`);
      assert.ok(Math.abs(menu.y - caption.y - caption.height - 8) < 1, `${width}px small gap from caption to navigation`);
      assert.ok(Math.abs(menu.width - gallery.width) < 1, `${width}px menu matches gallery column width`);
      assert.ok(menu.height >= 90 && menu.height <= 105, `${width}px compact detail menu (actual ${menu.height}px)`);
      const menuImageFrame = await menuImage.locator('..').boundingBox();
      assert.equal(menuImageFrame.width, width < 640 ? 40 : 44);
      if (width >= 1024) {
        const menuItem = detailNavigation.getByRole('link', { name: 'Thông số kỹ thuật', exact: true });
        const itemWidth = (await menuItem.boundingBox()).width;
        assert.ok(itemWidth >= 70 && itemWidth <= 85, 'Desktop items fit their contents without stretching');
        assert.equal(await menuItem.evaluate(element => getComputedStyle(element).fontSize), '12px');
        assert.equal((await menuItem.locator('svg').boundingBox()).width, 24);
      }
      const thumbnail = await page.getByRole('button', { name: 'Xem ảnh 1', exact: true }).boundingBox();
      const imageBounds = await page.getByTestId('product-main-image').boundingBox();
      assert.ok(thumbnail.height <= 64 && Math.abs(thumbnail.y - imageBounds.y - imageBounds.height - 8) < 1, `${width}px compact thumbnails close to main image`);
      const menuItems = await detailNavigation.getByRole('link').evaluateAll(links => links.map(link => {
        const bounds = link.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y, width: bounds.width, overflows: link.scrollWidth > link.clientWidth };
      }));
      assert.ok(menuItems.every(item => Math.abs(item.y - menuItems[0].y) < 1 && !item.overflows), `${width}px four menu items stay in one row without text overflow`);
      for (let index = 1; index < menuItems.length; index++) assert.ok(Math.abs(menuItems[index].x - menuItems[index - 1].x - menuItems[index - 1].width - (width < 640 ? 12 : 32)) < 1, `${width}px compact fixed gap between menu items`);
      const groupCenter = (menuItems[0].x + menuItems[3].x + menuItems[3].width) / 2;
      assert.ok(Math.abs(groupCenter - menu.x - menu.width / 2) < 1, `${width}px menu items centered as a group`);
      assert.equal(await detailNavigation.evaluate(element => element.scrollWidth > element.clientWidth), false, `${width}px menu has no horizontal overflow`);
      if (width < 1024) assert.ok(title.y > gallery.y + gallery.height, `${width}px gallery above product info`);
      else assert.ok(title.x > gallery.x + gallery.width, `${width}px gallery and info side by side`);
      if (width < 768) assert.ok(await page.getByLabel('Chọn ảnh sản phẩm').evaluate(el => el.scrollWidth > el.clientWidth && getComputedStyle(el).overflowX === 'auto'), `${width}px thumbnails scroll horizontally`);
      if (width === 390) { const buttons = page.getByTestId('product-detail').getByRole('button', { name: /^(Thêm vào giỏ hàng|Mua ngay)$/ }); const a = await buttons.nth(0).boundingBox(); const b = await buttons.nth(1).boundingBox(); assert.ok(b.y >= a.y + a.height); await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(100); await page.screenshot({ path: path.join(artifacts, 'mobile.png'), fullPage: true }); }
    }
    await prisma.productReview.createMany({ data: [
      { productId: product.id, rating: 4, content: 'Browser test published review', isPublished: true },
      { productId: product.id, rating: 5, content: 'Browser test published review', isPublished: true },
      { productId: product.id, rating: 1, content: 'Browser test unpublished review' },
    ] });
    await prisma.productComment.createMany({ data: [
      { productId: product.id, content: 'Browser test published comment', isPublished: true },
      { productId: product.id, content: 'Browser test published comment', isPublished: true },
      { productId: product.id, content: 'Browser test unpublished comment' },
    ] });
    const viewsBeforeReload = await prisma.productView.count({ where: { productId: product.id } });
    await page.reload(); await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
    await statistics.getByRole('button', { name: 'Xem 2 đánh giá, điểm 4.5 trên 5', exact: true }).waitFor();
    assert.equal(await statsCells.nth(1).locator('dd').innerText(), '2 Bình luận', 'Comments count comes from published database records');
    await page.waitForFunction(expected => document.querySelector('[data-testid="product-statistics"] > div:last-child dd')?.textContent === `${expected} Lượt xem`, viewsBeforeReload + 1);
    assert.equal(await prisma.productView.count({ where: { productId: product.id } }), viewsBeforeReload + 1, 'Reload records one new page visit');
    await page.getByRole('heading', { name: product.name, exact: true }).locator('..').locator('..').screenshot({ path: path.join(artifacts, 'statistics.png') });
    await statistics.getByRole('button', { name: 'Xem 2 đánh giá, điểm 4.5 trên 5', exact: true }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'product-reviews');
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Đã thêm sản phẩm vào giỏ hàng' }).waitFor();
    await page.getByRole('link', { name: 'Xem giỏ hàng', exact: true }).click(); await page.getByRole('heading', { name: 'Giỏ hàng', exact: true }).waitFor(); assert.ok((await page.locator('main').innerText()).includes(product.name));
    await page.reload(); await page.getByRole('link', { name: product.name, exact: true }).first().click(); await page.getByRole('button', { name: 'Mua ngay', exact: true }).click(); await page.waitForURL(`${base}/customer/checkout?product=${product.slug}`); await page.getByRole('heading', { name: 'Thanh toán', exact: true }).waitFor(); assert.ok((await page.locator('main').innerText()).includes(product.name));
    await page.goto(`${base}/products/${empty.slug}`); await page.getByRole('heading', { name: empty.name, exact: true }).waitFor(); await page.getByText('Hết hàng', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Mua ngay', exact: true }).isDisabled(), true); assert.equal(await page.getByRole('button', { name: 'Thêm vào giỏ hàng', exact: true }).isDisabled(), true);
    await page.getByText('Chưa có ảnh sản phẩm', { exact: true }).waitFor(); assert.equal(await page.locator('main del').count(), 0); await page.getByText('Thông số kỹ thuật đang được cập nhật.').waitFor();
    assert.equal(await page.getByRole('table').count(), 0, 'No empty specification table');
    assert.equal(await page.getByRole('region', { name: 'Thông số nổi bật', exact: true }).count(), 0, 'No empty highlight card');
    await statistics.getByRole('button', { name: 'Xem 0 đánh giá sản phẩm', exact: true }).waitFor();
    assert.equal(await detailNavigation.locator('img').count(), 0, 'Switching product removes previous product thumbnail');
    assert.equal(await detailNavigation.locator('svg').count(), 4, 'Missing product image uses placeholder');
    // Exercise first-image fallback using the current product's actual API images.
    let expectedFallback;
    await context.route(`**/api/products/${product.slug}`, async route => {
      const response = await route.fetch(); const body = await response.json();
      body.product.primaryImage = null;
      body.product.images.reverse();
      expectedFallback = body.product.images[0].imageUrl;
      await route.fulfill({ response, json: body });
    });
    await page.goto(`${base}/products/${product.slug}`); await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
    assert.ok((await menuImage.getAttribute('src')).endsWith(expectedFallback), 'Missing primary image uses first API image');
    await context.unroute(`**/api/products/${product.slug}`);
    await page.goto(`${base}/products/${marker}-missing`); await page.getByRole('heading', { name: 'Không tìm thấy sản phẩm', exact: true }).waitFor();
    let fail = true;
    await context.route(`**/api/products/${product.slug}`, async route => { if (fail) return route.fulfill({ status: 500, json: { message: 'Lỗi kiểm thử' } }); return route.continue(); });
    await page.goto(`${base}/products/${product.slug}`); await page.getByRole('heading', { name: 'Không tải được sản phẩm', exact: true }).waitFor(); fail = false; await page.getByRole('button', { name: 'Thử lại', exact: true }).click(); await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
    await context.unroute(`**/api/products/${product.slug}`);
    let release; const gate = new Promise(resolve => { release = resolve; });
    await context.route(`**/api/products/${product.slug}`, async route => { await gate; await route.continue(); });
    await page.goto(`${base}/products/${product.slug}`); await page.getByRole('status', { name: 'Đang tải chi tiết sản phẩm' }).waitFor(); release(); await page.getByRole('heading', { name: product.name, exact: true }).waitFor(); await context.unroute(`**/api/products/${product.slug}`);
    await page.goto(base); const homeSection = page.locator(`section[aria-labelledby="home-products-${section.id}"]`); await homeSection.getByRole('link', { name: `Xem chi tiết ${product.name}`, exact: true }).click(); await page.getByRole('heading', { name: product.name, exact: true }).waitFor();
    const imagePattern = `**${firstImage}`;
    await context.route(imagePattern, route => route.fulfill({ status: 404, body: '' }));
    await page.reload(); await page.getByTestId('product-main-image').getByRole('img', { name: 'Ảnh không khả dụng' }).waitFor();
    await page.waitForFunction(() => !document.querySelector('a[href="#product-gallery"] img'));
    assert.equal(await detailNavigation.locator('svg').count(), 4, 'Broken menu image falls back to placeholder');
    await context.unroute(imagePattern);
    assert.deepEqual(errors, []);
    console.log('PASS real API product detail browser: database review/comment/rating statistics, one persisted view per visit/reload, statistics/highlights order, no empty highlights, one gallery, detail navigation, stock/errors, cart/buy-now and 320–1440px responsive');
  } finally {
    if (browser) await browser.close();
    if (section) await prisma.productSection.deleteMany({ where: { id: section.id } });
    if (product || empty) await prisma.product.deleteMany({ where: { id: { in: [product?.id, empty?.id].filter(Boolean) } } });
    if (category) await prisma.category.deleteMany({ where: { id: category.id } });
    if (brand) await prisma.brand.deleteMany({ where: { id: brand.id } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
