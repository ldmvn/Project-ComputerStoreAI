const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const backend = path.resolve(__dirname, '../../backend');
require(path.join(backend, 'node_modules/dotenv')).config({ path: path.join(backend, '.env') });
const base = process.env.TEST_URL || 'http://localhost:3000';
(async () => {
  const { prisma } = await import(pathToFileURL(path.join(backend, 'src/config/prisma.js')));
  const { slugifyBrand } = await import(pathToFileURL(path.join(backend, 'src/validators/brand.validator.js')));
  const name = `Thương hiệu kiểm thử ${randomUUID().slice(0, 8)}`;
  const oldSlug = `legacy-${createHash('md5').update(name.toLowerCase()).digest('hex')}`;
  let browser, brand;
  try {
    brand = await prisma.brand.create({ data: { name, slug: oldSlug } });
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const badge = page.getByTestId('brand-filter-badge');
    await page.goto(`${base}/customer/products?brand=${oldSlug}`);
    await badge.filter({ hasText: `Thương hiệu: ${name}` }).waitFor();
    await prisma.brand.update({ where: { id: brand.id }, data: { slug: slugifyBrand(name) } });
    for (const query of [`brand=${slugifyBrand(name)}`, `brandId=${brand.id}`, `brand=${oldSlug}`, 'brand=does-not-exist']) {
      await page.goto(`${base}/customer/products?${query}&minPrice=2147483647`);
      await badge.filter({ hasText: query.includes('does-not-exist') ? 'Thương hiệu: Không khả dụng' : `Thương hiệu: ${name}` }).waitFor();
      assert.equal(/legacy-|brandId|does-not-exist/.test(await badge.innerText()), false);
    }
    // Arbitrary API names must be used verbatim, including when no products match.
    await context.route('**/api/products?**', route => route.fulfill({ json: { products: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 }, filters: { brand: { id: 789, name: 'Thương hiệu từ database', slug: 'internal-brand-key' } } } }));
    await page.goto(`${base}/customer/products?brand=internal-brand-key`);
    await page.getByTestId('brand-filter-badge').filter({ hasText: 'Thương hiệu: Thương hiệu từ database' }).waitFor();
    assert.equal((await page.getByTestId('brand-filter-badge').innerText()).includes('internal-brand-key'), false);
    assert.deepEqual(errors, []);
    console.log('PASS Brand badge browser: real slug/ID/legacy/unknown queries and arbitrary database name with no matching products; no raw technical values');
  } finally { if (browser) await browser.close(); if (brand) await prisma.brand.deleteMany({ where: { id: brand.id } }); await prisma.$disconnect(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
