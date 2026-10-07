import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { fileTypeFromFile } from 'file-type';
import sharp from 'sharp';
import { reviewError } from '../validators/productReview.validator.js';

const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
export const reviewMediaDirectory = path.join(path.resolve(process.env.MEDIA_STORAGE_DIR || path.join(backendRoot, 'uploads')), 'reviews');
const tempDirectory = path.join(path.resolve(process.env.MEDIA_STORAGE_DIR || path.join(backendRoot, 'uploads')), '.temporary-reviews');
const allowed = { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] };
const IMAGE_LIMIT = 10 * 1024 * 1024;
const MAX_FILES = 3;

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => mkdir(tempDirectory, { recursive: true }).then(() => callback(null, tempDirectory), callback),
    filename: (_req, _file, callback) => callback(null, randomUUID()),
  }),
  limits: { fileSize: IMAGE_LIMIT, files: MAX_FILES, fields: 10, fieldSize: 200000, parts: 16 },
  fileFilter: (_req, file, callback) => allowed[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase()) ? callback(null, true) : callback(reviewError('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP với MIME đúng.')),
}).array('images', MAX_FILES);

export function uploadReviewImages(req, res, next) {
  upload(req, res, error => {
    if (!error) return next();
    next(reviewError(error.code === 'LIMIT_FILE_SIZE' ? 'Ảnh đánh giá tối đa 10 MB.' : error.statusCode ? error.message : 'Upload ảnh đánh giá không hợp lệ.'));
  });
}

export async function discardReviewTemp(files = []) {
  await Promise.all(files.map(file => file?.path ? unlink(file.path).catch(() => {}) : Promise.resolve()));
}

export async function saveReviewImages(files = []) {
  await mkdir(reviewMediaDirectory, { recursive: true });
  const saved = [];
  try {
    for (const file of files) {
      const detected = await fileTypeFromFile(file.path);
      if (!detected || !allowed[file.mimetype]?.includes(path.extname(file.originalname).toLowerCase()) || detected.mime !== file.mimetype) throw reviewError('Nội dung ảnh không khớp MIME khai báo.');
      const key = `${randomUUID()}.webp`;
      const destination = path.join(reviewMediaDirectory, key);
      try {
        await sharp(file.path, { limitInputPixels: 40000000, failOn: 'error' }).rotate().webp({ quality: 88 }).toFile(destination);
      } catch {
        await removeReviewImage(key);
        throw reviewError('Ảnh không hợp lệ hoặc vượt giới hạn 40 triệu pixel.');
      }
      saved.push({ storageKey: key, imageUrl: `${(process.env.MEDIA_PUBLIC_URL || '/media').replace(/\/$/, '')}/reviews/${key}` });
    }
    return saved;
  } catch (error) {
    await Promise.all(saved.map(image => removeReviewImage(image.storageKey)));
    throw error;
  }
}

export async function removeReviewImage(key) {
  if (!/^[a-f0-9-]+\.webp$/.test(key || '')) return;
  await unlink(path.join(reviewMediaDirectory, key)).catch(error => { if (error.code !== 'ENOENT') console.error('Cannot remove review image:', error.code); });
}
