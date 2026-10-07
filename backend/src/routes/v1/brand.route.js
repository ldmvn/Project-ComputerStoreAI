import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { adminDetail, adminList, create, remove, status, update } from '../../controllers/brand.controller.js';
import { uploadBrandLogo } from '../../services/brandMedia.service.js';

export const adminBrandRouter = Router();
adminBrandRouter.use(authenticateToken, requireAdmin);
adminBrandRouter.get('/', adminList);
adminBrandRouter.get('/:id', adminDetail);
adminBrandRouter.post('/', uploadBrandLogo, create);
adminBrandRouter.put('/:id', uploadBrandLogo, update);
adminBrandRouter.patch('/:id/status', status);
adminBrandRouter.delete('/:id', remove);