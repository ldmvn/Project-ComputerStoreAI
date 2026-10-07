import { createProductReview, listProductReviews } from '../services/productStatistics.service.js';
import { discardReviewTemp, saveReviewImages } from '../services/reviewMedia.service.js';
import { parseReviewListQuery, parseReviewPayload, reviewError } from '../validators/productReview.validator.js';

const asyncHandler = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

function parseBody(req) {
  try { return parseReviewPayload(req.body); } catch (error) { if (error instanceof SyntaxError) throw reviewError('Dữ liệu đánh giá không hợp lệ.'); throw error; }
}

async function withImages(req, work) {
  let saved = [];
  try { saved = await saveReviewImages(req.files || []); return await work(saved); }
  catch (error) { await Promise.all(saved.map(image => removeReviewImage(image.storageKey))); throw error; }
  finally { await discardReviewTemp(req.files || []); }
}

function removeReviewImage(key) { return import('../services/reviewMedia.service.js').then(({ removeReviewImage }) => removeReviewImage(key)); }

export const listReviews = asyncHandler(async (req, res) => {
  const query = parseReviewListQuery(req.query);
  const result = await listProductReviews(req.params.slug, query);
  res.json(result);
});

export const createReview = asyncHandler(async (req, res) => withImages(req, async images => res.status(201).json({ review: await createProductReview(req.params.slug, req.user.userId, parseBody(req), images.map(image => image.imageUrl)), message: 'Gửi đánh giá thành công.' })));
