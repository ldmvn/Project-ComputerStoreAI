import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { fileTypeFromFile } from 'file-type';
import sharp from 'sharp';
import { productError } from '../validators/product.validator.js';

const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
export const productMediaDirectory = path.join(path.resolve(process.env.MEDIA_STORAGE_DIR || path.join(backendRoot, 'uploads')), 'products');
const tempDirectory = path.join(path.resolve(process.env.MEDIA_STORAGE_DIR || path.join(backendRoot, 'uploads')), '.temporary-products');
const allowed = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };
const IMAGE_LIMIT = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => mkdir(tempDirectory, { recursive: true }).then(() => callback(null, tempDirectory), callback),
    filename: (_req, _file, callback) => callback(null, randomUUID()),
  }),
  limits: { fileSize: IMAGE_LIMIT, files: 10, fields: 20, fieldSize: 200000, parts: 32 },
  fileFilter: (_req, file, callback) => allowed[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase()) ? callback(null, true) : callback(productError('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP với MIME đúng.')),
}).array('images', 10);

export function uploadProductImages(req, res, next) {
  upload(req, res, error => {
    if (!error) return next();
    next(productError(error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh sản phẩm tối đa 10 MB.' : error.statusCode ? error.message : 'Upload ảnh sản phẩm không hợp lệ.'));
  });
}

export async function discardProductTemp(files = []) {
  await Promise.all(files.map(file => file?.path ? unlink(file.path).catch(() => {}) : Promise.resolve()));
}

export async function saveProductImages(files = []) {
  await mkdir(productMediaDirectory, { recursive: true });
  const saved = [];
  try {
    for (const file of files) {
      const detected = await fileTypeFromFile(file.path);
      if (!detected || !allowed[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase()) || detected.mime !== file.mimetype) throw productError('Nội dung ảnh không khớp MIME khai báo.');
      const key = `${randomUUID()}.webp`;
      const destination = path.join(productMediaDirectory, key);
      try {
        await sharp(file.path, { limitInputPixels: 40000000, failOn: 'error' }).rotate().webp({ quality: 88 }).toFile(destination);
      } catch {
        await removeProductImage(key);
        throw productError('Ảnh không hợp lệ hoặc vượt giới hạn 40 triệu pixel.');
      }
      saved.push({ storageKey: key, imageUrl: `${(process.env.MEDIA_PUBLIC_URL || '/media').replace(/\/$/, '')}/products/${key}` });
    }
    return saved;
  } catch (error) {
    await Promise.all(saved.map(image => removeProductImage(image.storageKey)));
    throw error;
  }
}

export async function removeProductImage(key) {
  if (!/^[a-f0-9-]+\.webp$/.test(key || '')) return;
  await unlink(path.join(productMediaDirectory, key)).catch(error => { if (error.code !== 'ENOENT') console.error('Cannot remove product image:', error.code); });
}
