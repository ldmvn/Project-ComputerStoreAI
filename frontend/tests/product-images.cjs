const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('../../backend/node_modules/sharp');
require('../../backend/node_modules/dotenv').config({ path: path.resolve(__dirname, '../../backend/.env') });

(async () => {
  const { prisma } = await import('../../backend/src/config/prisma.js');
  const { createAccessToken } = await import('../../backend/src/services/token.service.js');
  const { removeProductImage, productMediaDirectory } = await import('../../backend/src/services/productMedia.service.js');
  const base = process.env.TEST_URL || 'http://localhost:3000';
  const api = process.env.PRODUCT_TEST_API || 'http://localhost:5000/api';
  const backendOrigin = new URL(api).origin;
  const marker = `product-images-${randomUUID()}`;
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'product-images-'));
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const keys = new Set();
  let user;
  let token;
  let section;
  const errors = [];
  const imageResponses = [];

  async function request(route, method = 'GET', body) {
    const headers = { Authorization: `Bearer ${token}` };
    if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch(api + route, { method, headers, body });
    return { status: response.status, data: await response.json() };
  }
  function remember(product) { product.images?.forEach(image => keys.add(image.imageUrl.split('/').pop())); return product; }
  function form(product, additions = {}) {
    const body = new FormData();
    for (const key of ['name', 'slug', 'sku', 'price', 'originalPrice', 'category', 'brand', 'shortDescription', 'description', 'stockQuantity', 'lowStockThreshold', 'isActive']) body.set(key, String(product[key] ?? ''));
    body.set('specifications', JSON.stringify(product.specifications?.map(({ name, value }) => ({ name, value })) ?? []));
    for (const [key, value] of Object.entries(additions)) body.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    return body;
  }
  async function imageLoaded(locator, expected) {
    await locator.waitFor();
    assert.equal(await locator.getAttribute('src'), new URL(expected, backendOrigin).href);
    await locator.evaluate(image => image.complete && image.naturalWidth > 0 ? Promise.resolve() : new Promise((resolve, reject) => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', () => reject(Error('Image did not load: ' + image.src)), { once: true }); }));
    assert.ok(await locator.evaluate(image => image.naturalWidth > 0));
  }

  try {
    const imageInput = sharp({ create: { width: 350, height: 500, channels: 3, background: '#f97316' } });
    const png = await imageInput.clone().png().toBuffer();
    const jpeg = await imageInput.clone().jpeg().toBuffer();
    const webp = await imageInput.clone().webp().toBuffer();
    user = await prisma.user.create({ data: { fullName: marker, email: `${marker}@example.com`, phone: marker, passwordHash: 'unused-browser-test', role: 'ADMIN' } });
    token = createAccessToken(user);
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(value => sessionStorage.setItem('accessToken', value), token);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().includes('/media/products/')) imageResponses.push({ url: response.url(), status: response.status() }); });

    const row = name => page.locator('table tbody tr').filter({ has: page.getByText(name, { exact: true }) });
    async function openCreate(suffix) {
      await page.goto(base + '/admin/products');
      await page.getByRole('button', { name: 'Thêm sản phẩm', exact: true }).click();
      const dialog = page.getByRole('dialog');
      const name = `${marker}-${suffix}`;
      await dialog.getByLabel('Tên sản phẩm *', { exact: true }).fill(name);
      await dialog.locator('select').first().selectOption({ index: 1 });
      await dialog.getByLabel('Giá bán (sau giảm) (₫) *', { exact: true }).fill('18090000');
      return { dialog, name };
    }
    async function save(dialog, method = 'POST', expectedStatus = 201) {
      const pending = page.waitForResponse(response => response.url().startsWith(api + '/admin/products') && response.request().method() === method);
      await dialog.getByRole('button', { name: 'Lưu sản phẩm', exact: true }).click();
      const response = await pending;
      const data = await response.json();
      assert.equal(response.status(), expectedStatus, JSON.stringify(data));
      if (expectedStatus >= 400) return { response, data };
      await dialog.waitFor({ state: 'hidden' });
      return { response, product: remember(data.product) };
    }
    async function edit(product) {
      await page.goto(base + '/admin/products');
      await row(product.name).getByRole('button', { name: `Sửa ${product.name}`, exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('Tên sản phẩm *', { exact: true }).waitFor();
      return dialog;
    }

    let { dialog } = await openCreate('no-image');
    const without = (await save(dialog)).product;
    assert.equal(without.images.length, 0);
    assert.equal(without.primaryImage, null);
    const createdSection = await request('/admin/product-sections', 'POST', { name: marker, slug: marker, subtitle: '', viewAllUrl: '/customer/products', sortOrder: 999999, isActive: true });
    assert.equal(createdSection.status, 201);
    section = createdSection.data.section;
    assert.equal((await request(`/admin/product-sections/${section.id}/products`, 'POST', { productIds: [without.id] })).status, 200);
    await page.goto(base);
    const homeSection = page.locator(`section[aria-labelledby="home-products-${section.id}"]`);
    await homeSection.locator('article').waitFor();
    assert.equal(await homeSection.locator('article img').count(), 0);
    assert.equal(await homeSection.locator('article > div:first-child svg').count(), 1);
    console.log('PASS 1: product without an image saves and shows a placeholder');

    ({ dialog } = await openCreate('one-image'));
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'invalid.gif', mimeType: 'image/gif', buffer: png });
    assert.match(await dialog.getByRole('alert').textContent(), /JPG, PNG/);
    const oversized = Buffer.alloc(10 * 1024 * 1024 + 1);
    png.copy(oversized);
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: oversized });
    assert.match(await dialog.getByRole('alert').textContent(), /10 MB/);
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'product.png', mimeType: 'image/png', buffer: png });
    await dialog.getByAltText('Ảnh mới').evaluate(image => image.complete && image.naturalWidth ? Promise.resolve() : new Promise(resolve => image.onload = resolve));
    assert.ok((await dialog.getByAltText('Ảnh mới').getAttribute('src')).startsWith('blob:'));
    let result = await save(dialog);
    let product = result.product;
    assert.match(result.response.request().headers()['content-type'], /^multipart\/form-data; boundary=/);
    const uploadBody = result.response.request().postDataBuffer();
    if (uploadBody) assert.match(uploadBody.toString(), /name="images"; filename="product.png"/);
    assert.equal(product.images.length, 1);
    assert.ok(product.images[0].isPrimary);
    assert.ok(!product.images[0].imageUrl.startsWith('blob:'));
    await fs.access(path.join(productMediaDirectory, product.images[0].imageUrl.split('/').pop()));
    assert.equal(await prisma.productImage.count({ where: { productId: product.id } }), 1);
    await page.reload();
    await imageLoaded(row(product.name).locator('img'), product.primaryImage);
    await row(product.name).getByRole('button', { name: `Xem chi tiết ${product.name}`, exact: true }).click();
    await imageLoaded(page.getByRole('dialog').locator('img'), product.primaryImage);
    await page.getByRole('dialog').getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
    await page.screenshot({ path: path.join(directory, 'admin-reloaded.png'), fullPage: true });
    console.log('PASS 2: blob preview, multipart images, stored WebP/DB relation, Admin reload and detail image');

    assert.equal((await request(`/admin/product-sections/${section.id}/products`, 'POST', { productIds: [product.id] })).status, 200);
    await page.goto(base);
    await imageLoaded(homeSection.locator('article').filter({ hasText: product.name }).locator('img'), product.primaryImage);
    await homeSection.screenshot({ path: path.join(directory, 'home-uploaded.png') });
    const publicList = await request(`/products?search=${encodeURIComponent(product.name)}`);
    assert.equal(publicList.data.products[0].primaryImage, product.primaryImage);
    const publicDetail = await request(`/products/${product.slug}`);
    assert.equal(publicDetail.data.product.images[0].imageUrl, product.primaryImage);
    console.log('PASS 3/4: public Product API and Home ProductSection use the stored product image');

    dialog = await edit(product);
    await imageLoaded(dialog.locator('img').first(), product.primaryImage);
    await dialog.locator('input[type="file"]').setInputFiles([{ name: 'second.jpeg', mimeType: 'image/jpeg', buffer: jpeg }, { name: 'third.webp', mimeType: 'image/webp', buffer: webp }]);
    assert.equal(await dialog.getByAltText('Ảnh mới').count(), 2);
    product = (await save(dialog, 'PUT', 200)).product;
    assert.equal(product.images.length, 3);
    assert.equal(product.images.filter(image => image.isPrimary).length, 1);
    assert.equal(await prisma.productImage.count({ where: { productId: product.id } }), 3);
    console.log('PASS 5: multiple PNG/JPEG/WebP uploads persist with exactly one primary image');

    const previousIds = product.images.map(image => image.id);
    dialog = await edit(product);
    product = (await save(dialog, 'PUT', 200)).product;
    assert.deepEqual(product.images.map(image => image.id), previousIds);
    result = await request(`/admin/products/${product.id}`, 'PUT', form(product));
    assert.equal(result.status, 200);
    product = remember(result.data.product);
    assert.deepEqual(product.images.map(image => image.id), previousIds);
    console.log('PASS 6: edit without new files preserves images, including API omission of keepImageIds');

    const newPrimary = product.images[2];
    dialog = await edit(product);
    await dialog.getByRole('button', { name: 'Đưa ảnh lên', exact: true }).nth(2).click();
    await dialog.getByRole('button', { name: 'Đưa ảnh lên', exact: true }).nth(1).click();
    product = (await save(dialog, 'PUT', 200)).product;
    assert.equal(product.primaryImage, newPrimary.imageUrl);
    assert.equal(product.images.filter(image => image.isPrimary).length, 1);
    await page.reload();
    await imageLoaded(row(product.name).locator('img'), newPrimary.imageUrl);
    await page.goto(base);
    await imageLoaded(homeSection.locator('article').filter({ hasText: product.name }).locator('img'), newPrimary.imageUrl);
    await homeSection.screenshot({ path: path.join(directory, 'home-primary.png') });
    console.log('PASS 7: changing the primary image updates Admin and Home after reload');

    await prisma.productImage.updateMany({ where: { productId: product.id }, data: { isPrimary: false } });
    const fallbackList = await request(`/products?search=${encodeURIComponent(product.name)}`);
    assert.equal(fallbackList.data.products[0].primaryImage, newPrimary.imageUrl);
    const fallbackHome = await request('/product-sections/home');
    assert.equal(fallbackHome.data.sections.find(item => item.id === section.id).products.find(item => item.id === product.id).primaryImage, newPrimary.imageUrl);
    const reorder = [product.images[1].id, product.images[0].id, product.images[2].id];
    result = await request(`/admin/products/${product.id}`, 'PUT', form(product, { keepImageIds: reorder, imageOrderIds: reorder }));
    product = remember(result.data.product);
    assert.equal(product.images[0].id, reorder[0]);
    assert.equal(product.images.filter(image => image.isPrimary).length, 1, 'Do not assign a second primary from stale image flags');
    console.log('PASS fallback: missing primary flag still returns first image; reorder restores one primary');

    const removed = product.images[0];
    const keep = [product.images[2].id, product.images[1].id];
    result = await request(`/admin/products/${product.id}`, 'PUT', form(product, { keepImageIds: keep, imageOrderIds: keep }));
    assert.equal(result.status, 200);
    product = remember(result.data.product);
    assert.equal(product.images.length, 2);
    assert.equal(product.images[0].id, keep[0]);
    assert.equal(product.images.filter(image => image.isPrimary).length, 1);
    assert.equal(await prisma.productImage.count({ where: { id: removed.id } }), 0);
    await assert.rejects(fs.access(path.join(productMediaDirectory, removed.imageUrl.split('/').pop())));
    const replacement = form(product, { keepImageIds: [], imageOrderIds: [] });
    replacement.append('images', new Blob([webp], { type: 'image/webp' }), 'replacement.webp');
    result = await request(`/admin/products/${product.id}`, 'PUT', replacement);
    assert.equal(result.status, 200);
    product = remember(result.data.product);
    assert.equal(product.images.length, 1);
    assert.ok(product.images[0].isPrimary);
    console.log('PASS removal/replacement: explicit removal cleans relations/files and new image becomes primary');

    dialog = await edit(product);
    await dialog.locator('input[type="file"]').setInputFiles({ name: 'corrupt.png', mimeType: 'image/png', buffer: png.subarray(0, 32) });
    await save(dialog, 'PUT', 400);
    assert.match(await dialog.getByRole('alert').textContent(), /Ảnh không hợp lệ|Nội dung ảnh/);
    assert.equal(await prisma.productImage.count({ where: { productId: product.id } }), 1);
    const tooLarge = form(product);
    tooLarge.append('images', new Blob([oversized], { type: 'image/png' }), 'large.png');
    const rejected = await request(`/admin/products/${product.id}`, 'PUT', tooLarge);
    assert.equal(rejected.status, 400);
    assert.match(rejected.data.message, /10 MB/);
    assert.equal(await prisma.productImage.count({ where: { productId: product.id } }), 1);
    assert.ok(imageResponses.some(response => response.status === 200 && response.url.startsWith(backendOrigin)));
    assert.deepEqual(imageResponses.filter(response => response.status >= 400), []);
    assert.deepEqual(errors, []);
    console.log('PASS validation: invalid MIME/corrupt content shows Admin error without losing saved images');
    console.log(`Screenshots/fixtures: ${directory}`);
  } finally {
    await browser.close();
    const owned = await prisma.product.findMany({ where: { name: { startsWith: marker } }, include: { images: true } });
    owned.forEach(product => remember(product));
    if (section) await prisma.productSection.delete({ where: { id: section.id } });
    await prisma.product.deleteMany({ where: { id: { in: owned.map(product => product.id) } } });
    await Promise.all([...keys].map(key => removeProductImage(key)));
    if (user) await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
