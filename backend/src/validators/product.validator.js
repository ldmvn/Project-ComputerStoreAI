export function productError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function int(value, label, min = 0) {
  const number = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(number) || number < min) throw productError(`${label} phải là số nguyên từ ${min}.`);
  return number;
}

export function productId(value) { return int(value, 'ID sản phẩm', 1); }

export function parseProductPayload(input = {}) {
  const name = String(input.name || '').trim();
  const slug = String(input.slug || '').trim().toLowerCase();
  const sku = String(input.sku || '').trim().toUpperCase();
  if (!name || name.length > 191) throw productError('Tên sản phẩm bắt buộc, tối đa 191 ký tự.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw productError('Slug chỉ gồm chữ thường, số và dấu gạch ngang.');
  if (!/^[A-Z0-9][A-Z0-9._-]{1,99}$/.test(sku)) throw productError('SKU bắt buộc và chỉ gồm chữ, số, dấu chấm, gạch ngang hoặc gạch dưới.');
  const price = int(input.price, 'Giá bán');
  const optionalMoney = (value, label) => value === '' || value === undefined || value === null ? null : int(value, label);
  const originalPrice = optionalMoney(input.originalPrice, 'Giá gốc');
  const costPrice = optionalMoney(input.costPrice, 'Giá nhập');
  const stockQuantity = int(input.stockQuantity ?? 0, 'Tồn kho');
  const lowStockThreshold = int(input.lowStockThreshold ?? 5, 'Ngưỡng sắp hết');
  const categoryId = input.categoryId === '' || input.categoryId === undefined || input.categoryId === null ? null : int(input.categoryId, 'ID danh mục', 1);
  const subtitle = value => typeof value === 'string' ? value.trim() || null : null;
  let specifications = [];
  if (input.specifications) {
    try { specifications = typeof input.specifications === 'string' ? JSON.parse(input.specifications) : input.specifications; } catch { throw productError('Thông số kỹ thuật không hợp lệ.'); }
  }
  if (!Array.isArray(specifications) || specifications.length > 100) throw productError('Danh sách thông số kỹ thuật không hợp lệ.');
  specifications = specifications.map((item, index) => {
    const specName = String(item?.name || '').trim(); const value = String(item?.value || '').trim();
    if (!specName || !value || specName.length > 100 || value.length > 500) throw productError('Tên và giá trị thông số kỹ thuật không được để trống.');
    return { name: specName, value, sortOrder: index };
  });
  const isActive = input.isActive === false || input.isActive === 'false' ? false : true;
  const keepImageIds = input.keepImageIds === undefined ? undefined : (typeof input.keepImageIds === 'string' ? JSON.parse(input.keepImageIds) : input.keepImageIds);
  if (keepImageIds !== undefined && (!Array.isArray(keepImageIds) || keepImageIds.some(value => !Number.isSafeInteger(Number(value)) || Number(value) < 1))) throw productError('Danh sách ảnh giữ lại không hợp lệ.');
  const imageOrderIds = input.imageOrderIds === undefined ? keepImageIds : (typeof input.imageOrderIds === 'string' ? JSON.parse(input.imageOrderIds) : input.imageOrderIds);
  if (imageOrderIds !== undefined && (!Array.isArray(imageOrderIds) || imageOrderIds.some(value => !Number.isSafeInteger(Number(value)) || Number(value) < 1))) throw productError('Thứ tự ảnh không hợp lệ.');
  return {
    name, slug, sku, category: subtitle(input.category), categoryId, brand: subtitle(input.brand), shortDescription: subtitle(input.shortDescription), description: subtitle(input.description),
    price, originalPrice, costPrice, stockQuantity, lowStockThreshold, isActive, specifications, keepImageIds: keepImageIds?.map(Number), imageOrderIds: imageOrderIds?.map(Number),
  };
}

export function parseProductListQuery(query = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 20, 1), 100);
  const sortMap = { newest: [{ updatedAt: 'desc' }], oldest: [{ createdAt: 'asc' }], priceAsc: [{ price: 'asc' }], priceDesc: [{ price: 'desc' }], nameAsc: [{ name: 'asc' }], nameDesc: [{ name: 'desc' }], stockAsc: [{ stockQuantity: 'asc' }], stockDesc: [{ stockQuantity: 'desc' }] };
  return { page, limit, search: String(query.search || '').trim(), category: String(query.category || '').trim(), status: String(query.status || '').trim(), stock: String(query.stock || '').trim(), orderBy: sortMap[query.sort] || sortMap.newest };
}
