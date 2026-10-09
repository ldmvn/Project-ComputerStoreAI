import { prisma } from '../config/prisma.js';
import { attributeError } from '../validators/attribute.validator.js';

const valueOrder = [{ sortOrder: 'asc' }, { id: 'asc' }];
const include = {
  values: { orderBy: valueOrder },
  categories: { orderBy: { sortOrder: 'asc' }, include: { category: { select: { id: true, name: true, slug: true } } } },
  _count: { select: { productValues: true, menuItems: true } },
};
const orderBy = [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }];

function map(attribute) {
  return { ...attribute, categories: attribute.categories?.map(link => ({ ...link.category, sortOrder: link.sortOrder })) || [] };
}

function uniqueError(error) {
  if (error.code === 'P2002') throw attributeError('Slug thuộc tính hoặc giá trị này đã tồn tại.', 409);
  throw error;
}

export async function listAttributes({ activeOnly = false } = {}) {
  return (await prisma.attribute.findMany({ where: activeOnly ? { isActive: true } : {}, include, orderBy })).map(map);
}

export async function categoryAttributes(categoryId, { activeOnly = true } = {}) {
  const links = await prisma.categoryAttribute.findMany({
    where: { categoryId, ...(activeOnly ? { attribute: { isActive: true } } : {}) },
    orderBy: [{ attribute: { sortOrder: 'asc' } }, { attributeId: 'asc' }],
    include: { attribute: { include: { values: { where: activeOnly ? { isActive: true } : {}, orderBy: valueOrder } } } },
  });
  return links.map(link => ({ ...link.attribute, categorySortOrder: link.sortOrder }));
}

export async function categoryAttributesBySlug(slug) {
  const category = await prisma.category.findFirst({ where: { slug, isActive: true }, select: { id: true } });
  if (!category) throw attributeError('Danh mục không tồn tại.', 404);
  return categoryAttributes(category.id);
}

export async function createAttribute(data) {
  try { return map(await prisma.attribute.create({ data, include })); } catch (error) { uniqueError(error); }
}

export async function updateAttribute(id, data) {
  try { return map(await prisma.attribute.update({ where: { id }, data, include })); }
  catch (error) { if (error.code === 'P2025') throw attributeError('Thuộc tính không tồn tại.', 404); uniqueError(error); }
}

export async function setAttributeStatus(id, isActive) { return updateAttribute(id, { isActive }); }
export async function setAttributeOrder(id, sortOrder) { return updateAttribute(id, { sortOrder }); }

export async function deleteAttribute(id) {
  const attribute = await prisma.attribute.findUnique({ where: { id }, include: { _count: { select: { productValues: true } } } });
  if (!attribute) throw attributeError('Thuộc tính không tồn tại.', 404);
  if (attribute._count.productValues) throw attributeError(`Không thể xóa “${attribute.name}” vì đang được ${attribute._count.productValues} dữ liệu sản phẩm sử dụng. Hãy tắt thuộc tính thay vì xóa.`, 409);
  await prisma.$transaction(async tx => { await tx.categoryAttribute.deleteMany({ where: { attributeId: id } }); await tx.attributeValue.deleteMany({ where: { attributeId: id } }); await tx.attribute.delete({ where: { id } }); });
}

export async function saveCategories(id, categoryIds) {
  const attribute = await prisma.attribute.findUnique({ where: { id }, select: { sortOrder: true } });
  if (!attribute) throw attributeError('Thuộc tính không tồn tại.', 404);
  const found = await prisma.category.count({ where: { id: { in: categoryIds } } });
  if (found !== categoryIds.length) throw attributeError('Một hoặc nhiều danh mục không tồn tại.');
  await prisma.$transaction(async tx => {
    await tx.categoryAttribute.deleteMany({ where: { attributeId: id } });
    if (categoryIds.length) await tx.categoryAttribute.createMany({ data: categoryIds.map(categoryId => ({ categoryId, attributeId: id, sortOrder: attribute.sortOrder })) });
  });
  return map(await prisma.attribute.findUnique({ where: { id }, include }));
}

export async function createValue(attributeId, data) {
  const attribute = await prisma.attribute.findUnique({ where: { id: attributeId } });
  if (!attribute) throw attributeError('Thuộc tính không tồn tại.', 404);
  if (!['SELECT', 'MULTI_SELECT'].includes(attribute.type)) throw attributeError('Chỉ thuộc tính SELECT/MULTI_SELECT mới có danh sách giá trị.');
  try { return await prisma.attributeValue.create({ data: { ...data, attributeId } }); } catch (error) { uniqueError(error); }
}

export async function updateValue(id, data) {
  try { return await prisma.attributeValue.update({ where: { id }, data }); }
  catch (error) { if (error.code === 'P2025') throw attributeError('Giá trị thuộc tính không tồn tại.', 404); uniqueError(error); }
}

export async function deleteValue(id) {
  const value = await prisma.attributeValue.findUnique({ where: { id }, include: { _count: { select: { productValues: true } } } });
  if (!value) throw attributeError('Giá trị thuộc tính không tồn tại.', 404);
  if (value._count.productValues) throw attributeError(`Không thể xóa “${value.value}” vì đang được ${value._count.productValues} sản phẩm sử dụng. Hãy tắt giá trị thay vì xóa.`, 409);
  await prisma.attributeValue.delete({ where: { id } });
}
