export function productSectionError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function integer(value, label, min = 0) {
  const result = typeof value === 'number' ? value : typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(result) || result < min) throw productSectionError(`${label} phải là số nguyên từ ${min}.`);
  return result;
}

export function sectionId(value) {
  return integer(value, 'ID khối', 1);
}

export function productId(value) {
  return integer(value, 'ID sản phẩm', 1);
}

export function validateSection(input) {
  if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 150) {
    throw productSectionError('Tên khối bắt buộc, tối đa 150 ký tự.');
  }
  const slug = typeof input.slug === 'string' ? input.slug.trim().toLowerCase() : '';
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 191) {
    throw productSectionError('Slug chỉ gồm chữ thường, số và dấu gạch ngang.');
  }
  const subtitle = typeof input.subtitle === 'string' ? input.subtitle.trim() : '';
  const viewAllUrl = typeof input.viewAllUrl === 'string' ? input.viewAllUrl.trim() : '';
  if (subtitle.length > 191) throw productSectionError('Tiêu đề phụ tối đa 191 ký tự.');
  if (viewAllUrl.length > 1000 || (viewAllUrl && !isSafeUrl(viewAllUrl))) throw productSectionError('Link Xem tất cả không hợp lệ.');
  return {
    name: input.name.trim(),
    slug,
    subtitle: subtitle || null,
    viewAllUrl: viewAllUrl || `/customer/products?section=${slug}`,
    sortOrder: integer(input.sortOrder ?? 0, 'Thứ tự'),
    isActive: input.isActive === false || input.isActive === 'false' ? false : true,
  };
}

export function validateProductIds(input) {
  if (!Array.isArray(input?.productIds) || !input.productIds.length || input.productIds.length > 100) {
    throw productSectionError('Hãy chọn ít nhất một sản phẩm, tối đa 100 sản phẩm mỗi lần.');
  }
  const ids = input.productIds.map(productId);
  if (new Set(ids).size !== ids.length) throw productSectionError('Danh sách sản phẩm không được trùng nhau.');
  return ids;
}

export function validateReorderIds(input, label) {
  if (!Array.isArray(input?.ids) || input.ids.length > 500) throw productSectionError(`Danh sách sắp xếp ${label} không hợp lệ.`);
  const ids = input.ids.map(productId);
  if (new Set(ids).size !== ids.length) throw productSectionError('Danh sách sắp xếp không được trùng nhau.');
  return ids;
}

function isSafeUrl(value) {
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
