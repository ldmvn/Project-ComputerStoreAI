// ============================================================================
// Product Service — Business Logic Layer
// ----------------------------------------------------------------------------
// NGÔN NGỮ DỮ LIỆU: Tiếng Việt (mock data / comments)
// LƯU Ý KIẾN TRÚC: Service KHÔNG được phép:
//   - Đọc req, res
//   - Gọi Prisma trực tiếp (phải thông qua repositories)
//   - Trả về HTTP response
// Vai trò: nhận input đã được validate, gọi Repository, xử lý nghiệp vụ,
//          throw ApiError khi có lỗi nghiệp vụ.
// ============================================================================

import prisma from '../config/database.js';
import ApiError from '../utils/ApiError.js';
import { productRepository } from '../repositories/product.repository.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Tạo Prisma where clause linh hoạt từ filters của client */
const buildProductWhereClause = (filters) => {
  const { search, type, brand, categoryId, minPrice, maxPrice, isFeatured } =
    filters;

  const where = {
    isActive: true,
    ...(type && { type }),
    ...(brand && { brand: { equals: brand } }),
    ...(categoryId && { categoryId }),
    ...(typeof isFeatured === 'boolean' && { isFeatured }),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          price: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { brand: { contains: search } },
        { description: { contains: search } },
      ],
    }),
  };

  return where;
};

/** Tính pagination metadata */
const buildPaginationMeta = (page, limit, total) => {
  const safeLimit = Math.max(limit, 1);
  return {
    page,
    limit: safeLimit,
    total,
    totalPages: Math.ceil(total / safeLimit),
    hasNext: page * safeLimit < total,
    hasPrev: page > 1,
  };
};

// ---------------------------------------------------------------------------
// Public service API
// ---------------------------------------------------------------------------
/**
 * Lấy danh sách sản phẩm có phân trang + bộ lọc + sắp xếp
 *
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=12]
 * @param {string} [options.search]      - Tìm theo tên / brand / mô tả
 * @param {string} [options.type]        - PC | LAPTOP | ACCESSORY
 * @param {string} [options.brand]       - Ví dụ: "Dell", "Asus"
 * @param {string} [options.categoryId]  - UUID danh mục
 * @param {number} [options.minPrice]
 * @param {number} [options.maxPrice]
 * @param {boolean}[options.isFeatured]
 * @param {string} [options.sortBy='createdAt']  - createdAt | price | soldCount | ratingAvg
 * @param {string} [options.sortOrder='desc']   - asc | desc
 *
 * @returns {Promise<{ items: Product[], meta: PaginationMeta }>}
 */
const getProducts = async (options = {}) => {
  const page = Math.max(parseInt(options.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 12, 1), 100);
  const skip = (page - 1) * limit;

  const allowedSortFields = ['createdAt', 'price', 'soldCount', 'ratingAvg'];
  const sortBy = allowedSortFields.includes(options.sortBy)
    ? options.sortBy
    : 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

  const where = buildProductWhereClause(options);

  // Gọi repository (parallel để giảm latency)
  const [items, total] = await Promise.all([
    productRepository.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    productRepository.count({ where }),
  ]);

  return {
    items,
    meta: buildPaginationMeta(page, limit, total),
  };
};

/**
 * Lấy chi tiết một sản phẩm theo slug
 * @param {string} slug
 * @returns {Promise<Product>}
 * @throws  ApiError(404) nếu không tìm thấy
 */
const getProductBySlug = async (slug) => {
  if (!slug) {
    throw new ApiError(400, 'Slug sản phẩm không được để trống');
  }

  const product = await productRepository.findBySlug(slug);
  if (!product) {
    throw new ApiError(404, `Không tìm thấy sản phẩm với slug "${slug}"`);
  }

  // Tăng lượt xem — fire-and-forget, không chặn response
  productRepository
    .incrementViewCount(product.id)
    .catch((err) =>
      console.warn('[product.service] incrementViewCount failed:', err.message),
    );

  return product;
};

/**
 * Lấy sản phẩm nổi bật cho trang chủ
 * @param {number} [limit=8]
 * @returns {Promise<Product[]>}
 */
const getFeaturedProducts = async (limit = 8) => {
  return productRepository.findMany({
    where: { isActive: true, isFeatured: true },
    take: Math.min(Math.max(limit, 1), 50),
    orderBy: { soldCount: 'desc' },
  });
};

/**
 * Lấy sản phẩm liên quan (cùng category, loại trừ chính nó)
 * @param {string} productId
 * @param {number} [limit=4]
 */
const getRelatedProducts = async (productId, limit = 4) => {
  const current = await productRepository.findById(productId);
  if (!current) return [];

  return productRepository.findMany({
    where: {
      isActive: true,
      categoryId: current.categoryId,
      id: { not: productId },
    },
    take: Math.min(Math.max(limit, 1), 20),
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Tạo mới sản phẩm (dành cho Admin)
 */
const createProduct = async (payload) => {
  // Business rule: slug phải unique — kiểm tra trước khi insert
  const existing = await productRepository.findBySlug(payload.slug);
  if (existing) {
    throw new ApiError(409, `Slug "${payload.slug}" đã tồn tại`);
  }

  return productRepository.create({
    ...payload,
    specs: payload.specs ?? {},
    images: payload.images ?? [],
  });
};

/**
 * Cập nhật sản phẩm
 */
const updateProduct = async (productId, payload) => {
  const existing = await productRepository.findById(productId);
  if (!existing) {
    throw new ApiError(404, 'Sản phẩm không tồn tại');
  }

  // Nếu đổi slug thì phải check unique
  if (payload.slug && payload.slug !== existing.slug) {
    const dup = await productRepository.findBySlug(payload.slug);
    if (dup) throw new ApiError(409, `Slug "${payload.slug}" đã tồn tại`);
  }

  return productRepository.update(productId, payload);
};

/**
 * Xóa mềm sản phẩm (set isActive = false) — an toàn hơn xóa cứng
 */
const deleteProduct = async (productId) => {
  const existing = await productRepository.findById(productId);
  if (!existing) {
    throw new ApiError(404, 'Sản phẩm không tồn tại');
  }
  await productRepository.softDelete(productId);
  return { id: productId, deleted: true };
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
export const productService = {
  getProducts,
  getProductBySlug,
  getFeaturedProducts,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};

export default productService;
