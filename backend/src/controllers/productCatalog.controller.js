import { createProduct, getProduct, getProductBySlug, listCategories, listProducts, removeImage, setStatus, softDeleteProduct, updateProduct } from '../services/productCatalog.service.js';
import { discardProductTemp, removeProductImage, saveProductImages } from '../services/productMedia.service.js';
import { parseProductListQuery, parseProductPayload, productId, productError } from '../validators/product.validator.js';

const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

function parseBody(req) {
  try { return parseProductPayload(req.body); } catch (error) { if (error instanceof SyntaxError) throw productError('Dữ liệu sản phẩm không hợp lệ.'); throw error; }
}

async function withImages(req, work) {
  let saved = [];
  try { saved = await saveProductImages(req.files || []); return await work(saved); }
  catch (error) { await Promise.all(saved.map(image => removeProductImage(image.storageKey))); throw error; }
  finally { await discardProductTemp(req.files || []); }
}

export const adminList = asyncHandler(async (req, res) => {
  const result = await listProducts(parseProductListQuery(req.query));
  res.json({ products: result.items, meta: result.meta, stats: result.stats });
});
export const categories = asyncHandler(async (_req, res) => res.json({ categories: await listCategories() }));
export const adminDetail = asyncHandler(async (req, res) => res.json({ product: await getProduct(productId(req.params.id)) }));
export const publicList = asyncHandler(async (req, res) => {
  const result = await listProducts({ ...parseProductListQuery(req.query), status: 'active' });
  res.json({ products: result.items, meta: result.meta });
});
export const publicDetail = asyncHandler(async (req, res) => res.json({ product: await getProductBySlug(req.params.slug) }));
export const create = asyncHandler(async (req, res) => withImages(req, async images => res.status(201).json({ product: await createProduct(parseBody(req), images), message: 'Đã tạo sản phẩm.' })));
export const update = asyncHandler(async (req, res) => withImages(req, async images => res.json({ product: await updateProduct(productId(req.params.id), parseBody(req), images), message: 'Đã cập nhật sản phẩm.' })));
export const status = asyncHandler(async (req, res) => res.json({ product: await setStatus(productId(req.params.id), req.body?.isActive === true || req.body?.isActive === 'true'), message: 'Đã cập nhật trạng thái sản phẩm.' }));
export const remove = asyncHandler(async (req, res) => res.json({ result: await softDeleteProduct(productId(req.params.id)), message: 'Đã ẩn sản phẩm.' }));
export const deleteImage = asyncHandler(async (req, res) => res.json({ product: await removeImage(productId(req.params.id), productId(req.params.imageId)), message: 'Đã xóa ảnh sản phẩm.' }));
