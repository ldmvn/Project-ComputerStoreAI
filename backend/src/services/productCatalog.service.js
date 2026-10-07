import { prisma } from '../config/prisma.js';
import { productError } from '../validators/product.validator.js';
import { removeProductImage } from './productMedia.service.js';
import { resolveBrandFilter } from './brand.service.js';
import { getProductStatistics } from './productStatistics.service.js';

const imageOrder = [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }];
const detailInclude = { images: { orderBy: imageOrder }, specifications: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }, highlightSpecs: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }, brandRecord: true, categoryRecord: { select: { id: true, name: true, slug: true } } };
const listInclude = { images: { orderBy: imageOrder, take: 1 }, brandRecord: true };

function serialize(product, detail = false, publicView = false) {
  const primary = product.images?.find(image => image.isPrimary) || product.images?.[0] || null;
  return {
    id: product.id, name: product.name, slug: product.slug, sku: product.sku, category: product.categoryRecord?.name || product.category, categoryId: product.categoryId, categoryInfo: product.categoryRecord || null, brandId: product.brandId, brand: product.brandRecord?.name || product.brand, brandInfo: product.brandRecord ? { id: product.brandRecord.id, name: product.brandRecord.name, slug: product.brandRecord.slug, logoUrl: product.brandRecord.logoUrl } : null,
    shortDescription: product.shortDescription, description: detail ? product.description : undefined, price: product.price,
    originalPrice: product.originalPrice, costPrice: detail && !publicView ? product.costPrice : undefined, stockQuantity: product.stockQuantity,
    lowStockThreshold: product.lowStockThreshold, isActive: product.isActive, isDeleted: product.isDeleted,
    stockStatus: product.stockQuantity === 0 ? 'OUT_OF_STOCK' : product.stockQuantity <= product.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK',
    primaryImage: primary?.imageUrl || null, images: detail ? product.images : undefined, specifications: detail ? product.specifications : undefined, highlightSpecs: detail ? product.highlightSpecs : undefined,
    createdAt: product.createdAt, updatedAt: product.updatedAt,
  };
}

async function whereForQuery(filters, resolvedBrand) {
  const where = { isDeleted: false };
  const conditions = [];
  if (filters.search) conditions.push({ OR: [{ name: { contains: filters.search } }, { sku: { contains: filters.search } }, { slug: { contains: filters.search } }] });
  if (filters.category) {
    const category = await prisma.category.findUnique({ where: { slug: filters.category }, select: { id: true, name: true } });
    if (category) {
      const categories = await prisma.category.findMany({ select: { id: true, parentId: true, name: true } });
      const ids = new Set([category.id]);
      let changed = true;
      while (changed) { changed = false; for (const row of categories) if (ids.has(row.parentId) && !ids.has(row.id)) { ids.add(row.id); changed = true; } }
      conditions.push({ OR: [{ categoryId: { in: [...ids] } }, { categoryId: null, category: { in: categories.filter(row => ids.has(row.id)).map(row => row.name) } }] });
    } else conditions.push({ category: filters.category });
  }
  if (filters.brand || filters.brandId) conditions.push(resolvedBrand
    ? { OR: [{ brandId: resolvedBrand.id }, { brandId: null, brand: resolvedBrand.name }] }
    : { id: -1 });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) where.price = { ...(filters.minPrice === undefined ? {} : { gte: filters.minPrice }), ...(filters.maxPrice === undefined ? {} : { lte: filters.maxPrice }) };
  if (filters.attribute && filters.attributeValue) conditions.push({ specifications: { some: { name: filters.attribute, value: filters.attributeValue } } });
  if (conditions.length) where.AND = conditions;
  if (filters.status === 'active') where.isActive = true;
  if (filters.status === 'inactive') where.isActive = false;
  if (filters.status === 'outOfStock' || filters.stock === 'out') where.stockQuantity = 0;
  if (filters.stock === 'low') where.stockQuantity = { gt: 0, lte: 5 };
  return where;
}

async function getByIdOrThrow(id, detail = true) {
  const product = await prisma.product.findFirst({ where: { id, isDeleted: false }, include: detail ? detailInclude : listInclude });
  if (!product) throw productError('Không tìm thấy sản phẩm.', 404);
  return product;
}

async function resolveProductCategory(payload) {
  if (payload.categoryId === null) return { categoryId: null, category: payload.category };
  const category = await prisma.category.findUnique({ where: { id: payload.categoryId }, select: { id: true, name: true } });
  if (!category) throw productError('Danh mục sản phẩm không tồn tại.', 400);
  return { categoryId: category.id, category: category.name };
}

async function resolveProductBrand(payload) {
  if (payload.brandId === null) {
    if (!payload.brand) return { brandId: null, brand: null };
    const existing = await prisma.brand.findFirst({ where: { name: payload.brand }, select: { id: true, name: true } });
    return existing ? { brandId: existing.id, brand: existing.name } : { brandId: null, brand: payload.brand };
  }
  const brand = await prisma.brand.findUnique({ where: { id: payload.brandId }, select: { id: true, name: true } });
  if (!brand) throw productError('Thương hiệu sản phẩm không tồn tại.', 400);
  return { brandId: brand.id, brand: brand.name };
}

function mapUniqueError(error) {
  if (error.code !== 'P2002') throw error;
  const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : '';
  throw productError(target.includes('sku') ? 'SKU đã tồn tại.' : 'Slug đã tồn tại.', 409);
}

export async function listProducts(filters) {
  const resolvedBrand = await resolveBrandFilter(filters);
  const where = await whereForQuery(filters, resolvedBrand);
  const skip = (filters.page - 1) * filters.limit;
  const [rows, total, active, outOfStock, inactive] = await Promise.all([
    prisma.product.findMany({ where, include: listInclude, orderBy: filters.orderBy, skip, take: filters.limit }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { isDeleted: false, isActive: true } }),
    prisma.product.count({ where: { isDeleted: false, stockQuantity: 0 } }),
    prisma.product.count({ where: { isDeleted: false, isActive: false } }),
  ]);
  return { filters: { brand: resolvedBrand }, items: rows.map(product => serialize(product)), meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) }, stats: { total: await prisma.product.count({ where: { isDeleted: false } }), active, outOfStock, inactive } };
}

export async function getProduct(id) { return serialize(await getByIdOrThrow(id, true), true); }
export async function getProductBySlug(slug) {
  const product = await prisma.product.findFirst({ where: { slug, isDeleted: false, isActive: true }, include: detailInclude });
  if (!product) throw productError('Không tìm thấy sản phẩm.', 404);
  return { ...serialize(product, true, true), ...await getProductStatistics(product.id) };
}
export async function listCategories() {
  const rows = await prisma.product.findMany({ where: { isDeleted: false, category: { not: null } }, distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } });
  return rows.map(row => row.category).filter(Boolean);
}

export async function createProduct(payload, images) {
  try {
    const category = await resolveProductCategory(payload);
    const brand = await resolveProductBrand(payload);
    return await prisma.$transaction(async tx => {
      const product = await tx.product.create({ data: { name: payload.name, slug: payload.slug, sku: payload.sku, ...category, ...brand, shortDescription: payload.shortDescription, description: payload.description, price: payload.price, originalPrice: payload.originalPrice, costPrice: payload.costPrice, stockQuantity: payload.stockQuantity, lowStockThreshold: payload.lowStockThreshold, isActive: payload.isActive }, include: detailInclude });
      if (payload.specifications.length) await tx.productSpecification.createMany({ data: payload.specifications.map(spec => ({ ...spec, productId: product.id })) });
      if (payload.highlightSpecs.length) await tx.productHighlightSpec.createMany({ data: payload.highlightSpecs.map(spec => ({ ...spec, productId: product.id })) });
      if (images.length) await tx.productImage.createMany({ data: images.map((image, index) => ({ imageUrl: image.imageUrl, productId: product.id, sortOrder: index, isPrimary: index === 0 })) });
      return serialize(await tx.product.findUnique({ where: { id: product.id }, include: detailInclude }), true);
    });
  } catch (error) { mapUniqueError(error); }
}

export async function updateProduct(id, payload, images) {
  const current = await getByIdOrThrow(id, true);
  const category = await resolveProductCategory(payload);
  const brand = await resolveProductBrand(payload);
  let removedImages = [];
  try {
    const result = await prisma.$transaction(async tx => {
      await tx.product.update({ where: { id }, data: { name: payload.name, slug: payload.slug, sku: payload.sku, ...category, ...brand, shortDescription: payload.shortDescription, description: payload.description, price: payload.price, originalPrice: payload.originalPrice, costPrice: payload.costPrice, stockQuantity: payload.stockQuantity, lowStockThreshold: payload.lowStockThreshold, isActive: payload.isActive } });
      await tx.productSpecification.deleteMany({ where: { productId: id } });
      if (payload.specifications.length) await tx.productSpecification.createMany({ data: payload.specifications.map(spec => ({ ...spec, productId: id })) });
      await tx.productHighlightSpec.deleteMany({ where: { productId: id } });
      if (payload.highlightSpecs.length) await tx.productHighlightSpec.createMany({ data: payload.highlightSpecs.map(spec => ({ ...spec, productId: id })) });
      const keep = new Set(payload.keepImageIds ?? current.images.map(image => image.id));
      removedImages = current.images.filter(image => !keep.has(image.id));
      if (removedImages.length) await tx.productImage.deleteMany({ where: { id: { in: removedImages.map(image => image.id) } } });
      if (images.length) await tx.productImage.createMany({ data: images.map((image, index) => ({ imageUrl: image.imageUrl, productId: id, sortOrder: current.images.length + index, isPrimary: current.images.length === 0 && index === 0 })) });
      const remaining = await tx.productImage.findMany({ where: { productId: id }, orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }] });
      const remainingIds = new Set(remaining.map(image => image.id));
      const orderIds = [...new Set([...(payload.imageOrderIds ?? []), ...remaining.map(image => image.id)])].filter(imageId => remainingIds.has(imageId));
      await tx.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
      for (const [sortOrder, imageId] of orderIds.entries()) await tx.productImage.update({ where: { id: imageId }, data: { sortOrder, isPrimary: sortOrder === 0 } });
      return serialize(await tx.product.findUnique({ where: { id }, include: detailInclude }), true);
    });
    await Promise.all(removedImages.map(image => removeProductImage(image.imageUrl.split('/').pop())));
    return result;
  } catch (error) { mapUniqueError(error); }
}

export async function setStatus(id, isActive) {
  await getByIdOrThrow(id, false);
  return serialize(await prisma.product.update({ where: { id }, data: { isActive }, include: detailInclude }), true);
}

export async function softDeleteProduct(id) {
  const current = await getByIdOrThrow(id, false);
  await prisma.product.update({ where: { id }, data: { isActive: false, isDeleted: true, deletedAt: new Date() } });
  return { id: current.id, deleted: true };
}

export async function removeImage(id, imageId) {
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
  if (!image) throw productError('Không tìm thấy ảnh sản phẩm.', 404);
  await prisma.productImage.delete({ where: { id: imageId } });
  if (image.isPrimary) {
    await prisma.productImage.updateMany({ where: { productId: id }, data: { isPrimary: false } });
    const replacement = await prisma.productImage.findFirst({ where: { productId: id }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
    if (replacement) await prisma.productImage.update({ where: { id: replacement.id }, data: { isPrimary: true } });
  }
  await removeProductImage(image.imageUrl.split('/').pop());
  return getProduct(id);
}
