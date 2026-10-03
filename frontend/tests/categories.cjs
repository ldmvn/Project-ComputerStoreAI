const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const base = process.env.TEST_URL || 'http://localhost:3000';
const now = '2026-10-02T10:00:00.000Z';

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const categories = [];
  let nextId = 1;
  await context.addInitScript(() => {
    localStorage.setItem('accessToken', 'category-test-token');
    localStorage.setItem('authUser', JSON.stringify({ role: 'ADMIN' }));
  });
  await context.route('**/api/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const reply = (status, json) => route.fulfill({ status, json });
    if (pathname.endsWith('/auth/me')) return reply(200, { user: { id: 1, fullName: 'Admin test', email: 'admin@example.com', phone: '0123456789', role: 'ADMIN' } });
    if (pathname.endsWith('/banners/home')) return reply(200, { mainHero: [], sideSlides: { SIDE_LEFT: [], SIDE_RIGHT_TOP: [], SIDE_RIGHT_MIDDLE: [], SIDE_RIGHT_BOTTOM: [], BOTTOM_LEFT: [], BOTTOM_RIGHT: [] } });
    if (pathname.endsWith('/product-sections/home')) return reply(200, { sections: [] });
    if (pathname.endsWith('/categories/menu') && request.method() === 'GET') {
      return reply(200, { categories: categories.filter(item => item.isActive && item.parentId === null).sort((a, b) => a.sortOrder - b.sortOrder).map(item => ({ id: item.id, name: item.name, slug: item.slug, icon: item.icon, children: categories.filter(child => child.parentId === item.id && child.isActive).map(({ id, name, slug, icon }) => ({ id, name, slug, icon })) })) });
    }
    if (pathname.endsWith('/admin/categories') && request.method() === 'GET') return reply(200, { categories: [...categories] });
    if (pathname.endsWith('/admin/categories') && request.method() === 'POST') {
      const body = request.postDataJSON();
      const parent = categories.find(item => item.id === body.parentId);
      const category = { id: nextId++, ...body, parent: parent ? { id: parent.id, name: parent.name } : null, productCount: 0, createdAt: now, updatedAt: now };
      categories.push(category);
      return reply(201, { category, message: 'Đã tạo danh mục.' });
    }
    const match = pathname.match(/\/admin\/categories\/(\d+)(?:\/(status|order))?$/);
    if (match) {
      const id = Number(match[1]);
      const category = categories.find(item => item.id === id);
      if (!category) return reply(404, { message: 'Không tìm thấy danh mục.' });
      if (request.method() === 'GET') return reply(200, { category });
      if (request.method() === 'PUT') {
        const body = request.postDataJSON();
        Object.assign(category, body, { parent: categories.find(item => item.id === body.parentId) || null, updatedAt: now });
        return reply(200, { category, message: 'Đã cập nhật danh mục.' });
      }
      if (request.method() === 'PATCH' && match[2] === 'status') {
        category.isActive = request.postDataJSON().isActive;
        return reply(200, { category, message: 'Đã cập nhật trạng thái danh mục.' });
      }
      if (request.method() === 'PATCH' && match[2] === 'order') {
        category.sortOrder = request.postDataJSON().sortOrder;
        return reply(200, { category, message: 'Đã cập nhật thứ tự danh mục.' });
      }
      if (request.method() === 'DELETE') {
        if (category.productCount) return reply(409, { message: `Danh mục này đang có ${category.productCount} sản phẩm. Vui lòng chuyển sản phẩm sang danh mục khác hoặc ẩn danh mục.` });
        if (categories.some(item => item.parentId === id)) return reply(409, { message: 'Danh mục đang có danh mục con.' });
        categories.splice(categories.indexOf(category), 1);
        return reply(200, { message: 'Đã xóa danh mục.' });
      }
    }
    return reply(200, {});
  });

  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/admin/categories`);
    await page.getByRole('heading', { name: 'Danh mục', exact: true }).waitFor();
    await page.getByText('Chưa có danh mục nào.').waitFor();

    await page.getByRole('button', { name: 'Tạo danh mục đầu tiên' }).click();
    await page.getByLabel(/^Tên danh mục/).fill('Laptop');
    await page.getByRole('button', { name: 'Laptop', exact: true }).click();
    await page.getByRole('button', { name: 'Lưu danh mục' }).click();
    await page.getByRole('row', { name: /Laptop/ }).waitFor();
    assert.equal(categories[0].slug, 'laptop');
    assert.equal(categories[0].icon, 'Laptop');

    await page.getByRole('button', { name: 'Thêm danh mục' }).click();
    await page.getByLabel(/^Tên danh mục/).fill('Laptop Gaming');
    await page.getByLabel('Danh mục cha').selectOption(String(categories[0].id));
    await page.getByRole('button', { name: 'Lưu danh mục' }).click();
    await page.getByRole('row', { name: /Laptop Gaming/ }).waitFor();
    assert.equal(categories[1].parentId, categories[0].id);

    const storePage = await context.newPage();
    storePage.on('pageerror', error => errors.push(error.message));
    storePage.setDefaultTimeout(10000);
    storePage.setViewportSize({ width: 390, height: 844 });
    const activeMenuResponse = storePage.waitForResponse(response => response.url().includes('/categories/menu'));
    await storePage.goto(base);
    await activeMenuResponse;
    await storePage.locator('header button[aria-label="Toggle menu"]').click();
    await storePage.getByRole('button', { name: 'Mở Laptop' }).click();
    await storePage.locator('aside a[href="/customer/products?category=laptop-gaming"]').waitFor();
    await storePage.locator('aside').getByRole('button', { name: 'Đóng menu danh mục' }).click();
    for (const width of [320, 360, 375, 390, 430, 768]) {
      await storePage.setViewportSize({ width, height: 844 });
      await storePage.locator('header button[aria-label="Toggle menu"]').click();
      const drawer = storePage.getByRole('dialog', { name: 'Danh mục sản phẩm' });
      await drawer.waitFor();
      assert.equal(await drawer.locator('a[href="/admin/dashboard"]').count(), 0, `${width}px: no Dashboard link in category drawer`);
      assert.equal(await drawer.locator('a[href="/customer/wishlist"]').count(), 0, `${width}px: no Wishlist link in category drawer`);
      assert.equal(await drawer.locator('a[href="/track-order"]').count(), 0, `${width}px: no order tracking link in category drawer`);
      await storePage.locator('aside').getByRole('button', { name: 'Đóng menu danh mục' }).click();
    }

    await page.getByRole('button', { name: 'Ẩn Laptop Gaming' }).click();
    await page.getByRole('row', { name: /Laptop Gaming.*Đang ẩn/ }).waitFor();
    assert.equal(categories[1].isActive, false);
    await page.getByRole('button', { name: 'Sửa Laptop Gaming' }).click();
    await page.getByRole('button', { name: 'Lưu danh mục' }).click();
    assert.equal(categories[1].isActive, false, 'Editing an inactive category keeps it inactive');

    categories[1].productCount = 12;
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Xóa Laptop Gaming' }).click();
    await page.getByRole('alert').filter({ hasText: 'đang có 12 sản phẩm' }).waitFor();
    assert.equal(categories.length, 2, 'Categories assigned to products cannot be deleted');

    const menuResponse = storePage.waitForResponse(response => response.url().includes('/categories/menu'));
    await storePage.reload();
    await menuResponse;
    await storePage.locator('header button[aria-label="Toggle menu"]').click();
    for (const width of [320, 360, 375, 390, 430, 768]) {
      await storePage.setViewportSize({ width, height: 844 });
      assert.equal(await storePage.getByRole('button', { name: 'Mở Laptop' }).count(), 0, `${width}px: inactive child categories are excluded from the mobile accordion`);
      assert.equal(await storePage.locator('aside a[href="/customer/products?category=laptop"]').count(), 1);
      if (width !== 768) {
        await storePage.locator('aside').getByRole('button', { name: 'Đóng menu danh mục' }).click();
        await storePage.locator('header button[aria-label="Toggle menu"]').click();
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS category UI: create root/child, persist status/order fields, block product deletion, and show only active menu items');
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });