import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { adminDetail, adminList, create, order, publicMenu, remove, status, update } from '../../controllers/category.controller.js';

export const publicCategoryRouter = Router();
publicCategoryRouter.get('/', publicMenu);
publicCategoryRouter.get('/menu', publicMenu);

export const adminCategoryRouter = Router();
adminCategoryRouter.use(authenticateToken, requireAdmin);
adminCategoryRouter.get('/', adminList);
adminCategoryRouter.get('/:id', adminDetail);
adminCategoryRouter.post('/', create);
adminCategoryRouter.put('/:id', update);
adminCategoryRouter.delete('/:id', remove);
adminCategoryRouter.patch('/:id/status', status);
adminCategoryRouter.patch('/:id/order', order);