import * as service from '../services/review.service.js';

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

export const listMine = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  res.json(await service.listMyReviews(req.user.userId, { page, limit }));
});

export const deleteMine = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id <= 0) return res.status(400).json({ message: 'ID không hợp lệ.' });
  const deleted = await service.deleteMyReview(req.user.userId, id);
  if (!deleted) return res.status(404).json({ message: 'Đánh giá không tồn tại.' });
  res.json({ message: 'Đã xóa đánh giá.' });
});
