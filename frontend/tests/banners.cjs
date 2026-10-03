const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const sharp = require('../../backend/node_modules/sharp');
require('../../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });

(async () => {
  const { prisma } = await import('../../backend/src/config/prisma.js');
  const { createAccessToken } = await import('../../backend/src/services/token.service.js');
  const { removeBannerMedia } = await import('../../backend/src/services/media.service.js');
  const base = process.env.TEST_URL || 'http://localhost:3000';
  const api = process.env.BANNER_TEST_API || `http://localhost:${process.env.PORT || 5000}/api`;
  const marker = `banner-browser-${randomUUID()}`;
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'computerstoreai-banners-'));
  const image = path.join(directory, 'banner.png');
  const video = path.join(directory, 'banner.webm');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let user;
  const originalOrders = await prisma.banner.findMany({ where: { position: 'MAIN_HERO' }, select: { id: true, sortOrder: true } });
  const originalSideStates = await prisma.banner.findMany({ where: { group: 'SIDE' }, select: { id: true, isActive: true, position: true } });
  try {
    await sharp({ create: { width: 800, height: 350, channels: 3, background: '#f97316' } }).png().toFile(image);
    const capture = await browser.newPage();
    // Generate an actual, decodable video for upload/playback tests; never seed demo data.
    const videoBytes = await capture.evaluate(async () => {
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 280;
      const context = canvas.getContext('2d');
      context.fillStyle = '#ef4444'; context.fillRect(0, 0, 640, 280);
      const stream = canvas.captureStream(15);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = event => chunks.push(event.data);
      const finished = new Promise(resolve => recorder.onstop = resolve);
      recorder.start();
      await new Promise(resolve => setTimeout(resolve, 600)); recorder.stop(); await finished;
      stream.getTracks().forEach(track => track.stop());
      return Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer()));
    });
    await fs.writeFile(video, Buffer.from(videoBytes));
    await capture.close();
    if (process.env.BANNER_VIDEO_FIXTURE_OUTPUT) await fs.copyFile(video, process.env.BANNER_VIDEO_FIXTURE_OUTPUT);
    user = await prisma.user.create({ data: { fullName: marker, email: `${marker}@example.com`, phone: marker, passwordHash: 'unused-browser-test-password', role: 'ADMIN' } });
    const token = createAccessToken(user);
    const context = await browser.newContext();
    await context.addInitScript(token => sessionStorage.setItem('accessToken', token), token);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(`${message.location().url}: ${message.text()}`); });
    await page.goto(base + '/admin/banners');
    await page.getByRole('heading', { name: 'Quản lý Banner', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Thêm banner', exact: true }).waitFor();
    const geometryPage = await browser.newPage();
    await geometryPage.route('**/banners/home', async route => {
      const sample = { id: 1, name: 'ratio', mediaType: 'IMAGE', mediaUrl: '/media/banners/ratio.png', altText: 'ratio', targetUrl: null, autoplayInterval: 1000 };
      await route.fulfill({ json: { mainHero: [sample], sideLeft: sample, sideRightTop: sample, sideRightMiddle: sample, sideRightBottom: sample, bottomLeft: sample, bottomRight: sample } });
    });
    await geometryPage.route('**/media/banners/ratio.png', route => route.fulfill({ contentType: 'image/png', path: image }));
    await geometryPage.goto(base + '/');
    // Admin keeps its original recommended preview ratios; Home's compact hero is independent.
    await geometryPage.locator('[data-banner-position="MAIN_HERO"]').evaluate(el => { el.style.aspectRatio = '2 / 1'; el.style.maxHeight = 'none'; });
    const slotRatios = {};
    for (const position of ['MAIN_HERO', 'BOTTOM_LEFT', 'SIDE_LEFT', 'SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM', 'BOTTOM_RIGHT']) {
      const box = await geometryPage.locator(`[data-banner-position="${position}"]`).boundingBox();
      slotRatios[position] = box.width / box.height;
    }
    await geometryPage.close();

    async function add(position, name, isVideo = false, order = 0) {
      await page.getByRole('button', { name: 'Thêm banner', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tên banner', { exact: true }).fill(name);
      await dialog.getByLabel('Nhóm banner', { exact: true }).selectOption(position.startsWith('MAIN') ? 'MAIN' : 'SIDE');
      if (!position.startsWith('MAIN')) {
        assert.equal(await dialog.getByLabel('Vị trí', { exact: true }).inputValue(), 'AUTO');
        assert.equal(await dialog.getByLabel('Vị trí', { exact: true }).locator('option').count(), 7);
      }
      await dialog.getByLabel('Vị trí', { exact: true }).selectOption(position);
      await dialog.getByLabel('Loại media', { exact: true }).selectOption(isVideo ? 'VIDEO' : 'IMAGE');
      assert.equal(await dialog.locator('input[type="file"]').getAttribute('accept'), isVideo ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp');
      await dialog.locator('input[type="file"]').setInputFiles(isVideo ? video : image);
      await dialog.getByLabel('Alt text', { exact: true }).fill(name);
      await dialog.getByLabel('Thứ tự', { exact: true }).fill(String(order));
      await dialog.getByLabel('Thời gian chuyển slide (giây)', { exact: true }).fill('1');
      await dialog.getByLabel('Link khi click', { exact: true }).fill('/customer/products?search=banner');
      const source = dialog.locator(isVideo ? 'video' : 'img');
      await source.waitFor();
      await dialog.getByText(isVideo ? 'Media: 640 × 280 px.' : 'Media: 800 × 350 px.', { exact: true }).waitFor();
      const previewBox = await dialog.locator('[data-banner-form-preview]').boundingBox();
      assert.ok(Math.abs(previewBox.width / previewBox.height - slotRatios[position]) < 0.01, `${position}: preview matches real slot`);
      assert.ok(await dialog.getByText(/Kích thước khuyến nghị/).isVisible());
      assert.ok((await source.getAttribute('src')).startsWith('blob:'));
      await dialog.getByRole('button', { name: 'Lưu banner', exact: true }).click();
      await dialog.waitFor({ state: 'detached' });
      await page.getByRole('heading', { name, exact: true }).waitFor();
    }
    const topImage = marker + '-top-image'; const topVideo = marker + '-top-video';
    await add('MAIN_HERO', topImage, false, 999998);
    await add('MAIN_HERO', topVideo, true, 999999);
    await add('BOTTOM_LEFT', marker + '-bottom');
    for (const position of ['SIDE_LEFT', 'SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM', 'BOTTOM_RIGHT']) await add(position, marker + '-' + position, true);
    const sideList = page.getByRole('region', { name: 'Danh sách banner phụ', exact: true });
    assert.equal(await sideList.count(), 1);
    for (const position of ['SIDE_LEFT', 'SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM', 'BOTTOM_RIGHT']) {
      await sideList.getByRole('heading', { name: marker + '-' + position, exact: true }).waitFor();
    }
    await page.getByRole('button', { name: 'Thêm banner', exact: true }).click();
    let autoDialog = page.getByRole('dialog');
    assert.equal(await autoDialog.getByLabel('Vị trí', { exact: true }).inputValue(), 'AUTO');
    assert.equal(await autoDialog.getByRole('button', { name: 'Lưu banner', exact: true }).isEnabled(), false, 'All slots full: AUTO cannot silently replace data');
    await autoDialog.getByRole('button', { name: 'Hủy', exact: true }).click();
    const freeTestPosition = ['BOTTOM_LEFT', 'BOTTOM_RIGHT', 'SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM', 'SIDE_LEFT'].find(position => !originalSideStates.some(item => item.position === position && item.isActive));
    if (freeTestPosition) {
    const freedCard = sideList.locator('article').filter({ has: page.getByRole('heading', { name: freeTestPosition === 'BOTTOM_LEFT' ? marker + '-bottom' : marker + '-' + freeTestPosition, exact: true }) });
    await freedCard.getByRole('button', { name: 'Tắt', exact: true }).click();
    await freedCard.getByText('Inactive', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Thêm banner', exact: true }).click();
    autoDialog = page.getByRole('dialog');
    await autoDialog.getByLabel('Tên banner', { exact: true }).fill(marker + '-auto');
    await autoDialog.locator('input[type="file"]').setInputFiles(image);
    await autoDialog.getByText('Media: 800 × 350 px.', { exact: true }).waitFor();
    await autoDialog.getByRole('button', { name: 'Lưu banner', exact: true }).click();
    await autoDialog.waitFor({ state: 'detached' });
    await sideList.getByRole('heading', { name: marker + '-auto', exact: true }).waitFor();
    const savedAuto = await prisma.banner.findFirst({ where: { name: marker + '-auto' } });
    assert.equal(savedAuto.position, freeTestPosition);
    assert.equal(savedAuto.isActive, true);
    assert.equal(savedAuto.isAutoPlaced, true);
    const autoCard = sideList.locator('article').filter({ has: page.getByRole('heading', { name: marker + '-auto', exact: true }) });
    await autoCard.getByRole('button', { name: 'Sửa', exact: true }).click();
    const editingAuto = page.getByRole('dialog');
    assert.equal(await editingAuto.getByLabel('Vị trí', { exact: true }).inputValue(), 'AUTO');
    assert.equal(await editingAuto.getByLabel('Thời gian chuyển slide (giây)', { exact: true }).count(), 0);
    await editingAuto.getByLabel('Vị trí', { exact: true }).selectOption(freeTestPosition);
    await editingAuto.getByLabel('Thời gian chuyển slide (giây)', { exact: true }).fill('1');
    await editingAuto.getByRole('button', { name: 'Lưu banner', exact: true }).click();
    await editingAuto.waitFor({ state: 'detached' });
    assert.equal((await prisma.banner.findUnique({ where: { id: savedAuto.id } })).isAutoPlaced, false);
    }
    console.log('PASS browser: unified side list, AUTO default/full-slot guard, automatic upload into the free slot');

    await add('SIDE_LEFT', marker + '-side-second');
    const sameSlot = await prisma.banner.findMany({ where: { name: { startsWith: marker }, position: 'SIDE_LEFT' } });
    assert.equal(sameSlot.length, 2);
    assert.ok(sameSlot.every(item => item.isActive && item.autoplayInterval === 1000));
    console.log('PASS browser: second side media keeps both Active, with configurable autoplay');

    console.log('PASS browser: real admin uploads, blob previews, image/video CRUD, all seven positions');

    await page.getByRole('button', { name: 'Banner chính', exact: true }).click();
    const topCard = page.locator('article').filter({ has: page.getByRole('heading', { name: topVideo, exact: true }) });
    await topCard.getByRole('button', { name: `Đưa ${topVideo} lên`, exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Đã lưu thứ tự' }).waitFor();
    await topCard.getByRole('button', { name: 'Sửa', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Tên banner', { exact: true }).fill(topVideo + '-edited');
    await dialog.getByRole('button', { name: 'Lưu banner', exact: true }).click();
    await dialog.waitFor({ state: 'detached' });
    const edited = page.locator('article').filter({ has: page.getByRole('heading', { name: topVideo + '-edited', exact: true }) });
    await edited.getByRole('button', { name: 'Tắt', exact: true }).click();
    await edited.getByText('Inactive', { exact: true }).waitFor();
    let home = await (await fetch(api + '/banners/home')).json();
    assert.ok(!home.mainHero.some(banner => banner.name === topVideo + '-edited'));
    await edited.getByRole('button', { name: 'Bật', exact: true }).click();
    await edited.getByText('Active', { exact: true }).waitFor();
    await edited.getByRole('button', { name: 'Xem trước', exact: true }).click();
    assert.ok(await page.getByRole('dialog').locator('video[controls]').isVisible());
    await page.keyboard.press('Escape');
    console.log('PASS browser: edit without re-upload, reorder, toggle, grouped lists, video preview');

    const storefront = await browser.newPage();
    await storefront.route('**/banners/home', async route => {
      const response = await route.fetch();
      const content = await response.json();
      content.mainHero = content.mainHero.filter(banner => banner.name.startsWith(marker));
      if (content.sideSlides) for (const position of Object.keys(content.sideSlides)) content.sideSlides[position] = content.sideSlides[position].filter(banner => banner.name.startsWith(marker));
      await route.fulfill({ json: content });
    });
    storefront.on('pageerror', error => errors.push(error.message));
    await storefront.goto(base + '/');
    await storefront.getByRole('region', { name: 'Banner chính', exact: true }).waitFor();
    const slider = storefront.getByRole('region', { name: 'Banner chính', exact: true });
    await storefront.getByRole('button', { name: 'Banner chính: chọn banner 1' }).click();
    await slider.locator('video').waitFor();
    const playingVideo = slider.locator('video');
    await playingVideo.evaluate(element => new Promise((resolve, reject) => {
      if (element.readyState >= 2) return resolve();
      element.addEventListener('loadeddata', resolve, { once: true }); element.addEventListener('error', reject, { once: true });
    }));
    assert.ok(await playingVideo.evaluate(element => element.muted && element.autoplay && element.playsInline));
    await storefront.getByRole('button', { name: 'Banner chính: banner tiếp theo' }).click();
    await slider.locator('img').waitFor();
    await storefront.getByRole('button', { name: 'Banner chính: banner trước' }).click();
    await slider.locator('video').waitFor();
    assert.equal(await storefront.getByRole('button', { name: 'Giữa - Dưới: banner tiếp theo' }).count(), 0);
    await storefront.mouse.move(0, 0);
    await storefront.locator('footer').click(); // remove focus/hover from slider
    await slider.locator('img').waitFor();
    await slider.hover();
    const beforeSlide = await slider.locator('[aria-roledescription="slide"]').getAttribute('aria-label');
    await storefront.waitForTimeout(1300);
    assert.notEqual(await slider.locator('[aria-roledescription="slide"]').getAttribute('aria-label'), beforeSlide, 'Autoplay continues while hovering');
    const sideSlider = storefront.locator('[data-banner-position="SIDE_LEFT"] [aria-roledescription="carousel"]');
    assert.equal(await sideSlider.locator('[aria-roledescription="slide"]').getAttribute('aria-label').then(value => value.includes('/ 2:')), true);
    const sideBefore = await sideSlider.locator('[aria-roledescription="slide"]').getAttribute('aria-label');
    await storefront.waitForFunction(previous => document.querySelector('[data-banner-position="SIDE_LEFT"] [aria-roledescription="slide"]').getAttribute('aria-label') !== previous, sideBefore, { timeout: 4000 });
    console.log('PASS browser: real same-slot side carousel autoplays alongside the main carousel');
    for (const width of [320, 375, 390, 430, 440, 768, 1024, 1440]) {
      await storefront.setViewportSize({ width, height: 900 });
      const slots = storefront.locator('[data-banner-position]');
      await storefront.waitForFunction(count => document.querySelectorAll('[data-banner-position]').length === count, width <= 768 ? 3 : 7);
      assert.equal(await slots.count(), width <= 768 ? 3 : 7);
      for (const slot of await slots.all()) { const box = await slot.boundingBox(); assert.ok(box.height > 35 && box.width > 100 && box.x >= 0 && box.x + box.width <= width + 1); }
      assert.ok(await storefront.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      const boxes = {};
      for (const position of ['MAIN_HERO', 'BOTTOM_LEFT', 'SIDE_LEFT', 'SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM', 'BOTTOM_RIGHT'])  { const slot = storefront.locator(`[data-banner-position="${position}"]`); boxes[position] = await slot.count() ? await slot.boundingBox() : null; }
      assert.ok(boxes.MAIN_HERO.y < boxes.BOTTOM_LEFT.y);
      assert.ok(boxes.BOTTOM_LEFT.height < boxes.MAIN_HERO.height);
      assert.ok(Math.abs(boxes.BOTTOM_LEFT.y - boxes.BOTTOM_RIGHT.y) < 1);
      if (width >= 1024) {
        assert.ok(boxes.SIDE_LEFT.x < boxes.MAIN_HERO.x && boxes.MAIN_HERO.x < boxes.SIDE_RIGHT_TOP.x);
        assert.ok(boxes.SIDE_RIGHT_TOP.y < boxes.SIDE_RIGHT_MIDDLE.y && boxes.SIDE_RIGHT_MIDDLE.y < boxes.SIDE_RIGHT_BOTTOM.y);
      } else if (width <= 768) {
        assert.equal(boxes.SIDE_LEFT, null);
        assert.equal(boxes.SIDE_RIGHT_TOP, null);
      }

    }
    await storefront.setViewportSize({ width: 1440, height: 1000 });
    await storefront.screenshot({ path: path.join(directory, 'home-desktop.png'), fullPage: true });
    await storefront.setViewportSize({ width: 375, height: 900 });
    await storefront.screenshot({ path: path.join(directory, 'home-mobile.png'), fullPage: true });
    console.log('PASS browser: actual video playback, carousel next/previous/autoplay/hover/single-slide, seven-slot responsive layout 320–1440px');
    await storefront.close();

    // Empty/failed media states are isolated from database content.
    const emptyContext = await browser.newContext();
    await emptyContext.route('**/banners/home', route => route.fulfill({ json: { mainHero: [], bottomLeft: null, bottomRight: null, sideLeft: null, sideRightTop: null, sideRightMiddle: null, sideRightBottom: null } }));
    const emptyPage = await emptyContext.newPage();
    await emptyPage.goto(base + '/');
    await emptyPage.locator('section[aria-label="Banner khuyến mãi"]').waitFor({ state: 'detached' });
    assert.equal(await emptyPage.locator('[data-banner-position]').count(), 0);
    assert.equal(await emptyPage.locator('main .skeleton-shimmer').count(), 0);
    await emptyContext.unroute('**/banners/home');
    home = await (await fetch(api + '/banners/home')).json();
    const broken = { ...home.mainHero.find(banner => banner.name === topImage), mediaUrl: '/media/banners/nonexistent.webp' };
    await emptyContext.route('**/banners/home', route => route.fulfill({ json: { mainHero: [broken], bottomLeft: null, bottomRight: null, sideLeft: null, sideRightTop: null, sideRightMiddle: null, sideRightBottom: null } }));
    await emptyContext.route('**/media/banners/nonexistent.webp', route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'Missing test media' }));
    const missingMediaResponse = emptyPage.waitForResponse('**/media/banners/nonexistent.webp');
    await emptyPage.reload();
    await missingMediaResponse;
    await emptyPage.locator('section[aria-busy="false"]').waitFor();
    await emptyPage.waitForFunction(() => document.querySelector('[data-banner-position="MAIN_HERO"]') && !document.querySelector('[data-banner-position="MAIN_HERO"] img'));
    assert.equal(await emptyPage.locator('main .skeleton-shimmer').count(), 0);
    await emptyContext.close();
    console.log('PASS browser: empty hero hides section; broken media has no permanent skeleton/broken-image icon');

    // Deletion requires confirmation and survives reload.
    await edited.getByRole('button', { name: 'Xóa', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Hủy', exact: true }).click();
    assert.ok(await edited.isVisible());
    await edited.getByRole('button', { name: 'Xóa', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Xóa banner', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    assert.equal(await edited.count(), 0);
    await page.reload();
    await page.getByRole('heading', { name: topImage, exact: true }).waitFor();
    assert.equal(await page.getByRole('heading', { name: topVideo + '-edited', exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log('PASS browser: confirmation/cancel/delete, persistence after reload, no hydration/console errors');
    console.log('Screenshots:', directory);
    await context.close();
  } finally {
    const banners = await prisma.banner.findMany({ where: { name: { startsWith: marker } } });
    await prisma.banner.deleteMany({ where: { id: { in: banners.map(banner => banner.id) } } });
    for (const banner of banners) await removeBannerMedia(banner.mediaKey);
    for (const banner of originalOrders) await prisma.banner.updateMany({ where: { id: banner.id }, data: { sortOrder: banner.sortOrder } });
    for (const banner of originalSideStates) await prisma.banner.updateMany({ where: { id: banner.id }, data: { isActive: banner.isActive } });
    if (user) await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
