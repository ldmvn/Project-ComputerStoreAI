export const attributeError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

export function positiveId(value, label = 'ID') {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw attributeError(`${label} không hợp lệ.`);
  return id;
}

function integer(value, label) {
  const parsed = Number(value ?? 0);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw attributeError(`${label} phải là số nguyên từ 0.`);
  return parsed;
}

function boolean(value, fallback = true) {
  if (value === undefined) return fallback;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw attributeError('Trạng thái không hợp lệ.');
}

export function parseAttribute(input = {}) {
  const name = String(input.name || '').trim();
  const slug = String(input.slug || '').trim().toLowerCase();
  const type = String(input.type || '').trim();
  if (!name || name.length > 191) throw attributeError('Tên thuộc tính là bắt buộc và tối đa 191 ký tự.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw attributeError('Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.');
  if (!['SELECT', 'MULTI_SELECT', 'TEXT', 'NUMBER', 'BOOLEAN'].includes(type)) throw attributeError('Loại thuộc tính không hợp lệ.');
  return { name, slug, type, sortOrder: integer(input.sortOrder, 'Thứ tự'), isActive: boolean(input.isActive) };
}

export function parseValue(input = {}) {
  const value = String(input.value || '').trim();
  if (!value || value.length > 500) throw attributeError('Giá trị là bắt buộc và tối đa 500 ký tự.');
  return { value, sortOrder: integer(input.sortOrder, 'Thứ tự'), isActive: boolean(input.isActive) };
}

export function parseCategoryIds(input = {}) {
  if (!Array.isArray(input.categoryIds)) throw attributeError('Danh sách danh mục không hợp lệ.');
  return [...new Set(input.categoryIds.map(value => positiveId(value, 'Danh mục')))];
}

export const parseStatus = value => boolean(value);
export const parseOrder = value => integer(value, 'Thứ tự');
