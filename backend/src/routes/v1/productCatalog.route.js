import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { adminDetail, adminList, categories, create, deleteImage, publicDetail, publicFilters, publicList, publicView, remove, status, update } from '../../controllers/productCatalog.controller.js';
import { listReviews, createReview, deleteReview } from '../../controllers/productReview.controller.js';
import { uploadProductImages } from '../../services/productMedia.service.js';
import { uploadReviewImages } from '../../services/reviewMedia.service.js';

export const publicProductRouter = Router();
publicProductRouter.get('/', publicList);
publicProductRouter.get('/filters', publicFilters); // must precede '/:slug'
publicProductRouter.get('/:slug', publicDetail);
publicProductRouter.post('/:slug/views', publicView);
publicProductRouter.get('/:slug/reviews', listReviews);
publicProductRouter.post('/:slug/reviews', authenticateToken, uploadReviewImages, createReview);
publicProductRouter.delete('/:slug/reviews/:reviewId', authenticateToken, deleteReview);

export const adminProductRouter = Router();
adminProductRouter.use(authenticateToken, requireAdmin);
adminProductRouter.get('/categories', categories);
adminProductRouter.get('/', adminList);
adminProductRouter.get('/:id', adminDetail);
adminProductRouter.post('/', uploadProductImages, create);
adminProductRouter.put('/:id', uploadProductImages, update);
adminProductRouter.patch('/:id/status', status);
adminProductRouter.delete('/:id', remove);
adminProductRouter.delete('/:id/images/:imageId', deleteImage);
