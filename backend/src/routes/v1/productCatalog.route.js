import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { adminDetail, adminList, categories, create, deleteImage, publicDetail, publicList, remove, status, update } from '../../controllers/productCatalog.controller.js';
import { uploadProductImages } from '../../services/productMedia.service.js';

export const publicProductRouter = Router();
publicProductRouter.get('/', publicList);
publicProductRouter.get('/:slug', publicDetail);

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
