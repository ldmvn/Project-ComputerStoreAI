import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { uploadBannerMedia } from '../../services/media.service.js';
import { list, home, detail, save, remove, status, reorder } from '../../controllers/banner.controller.js';

export const publicBannerRouter = Router();
publicBannerRouter.get('/home', home);
// Management reads also include inactive banners, so they require admin access.
publicBannerRouter.get('/', authenticateToken, requireAdmin, list);
publicBannerRouter.get('/:id', authenticateToken, requireAdmin, detail);

export const adminBannerRouter = Router();
adminBannerRouter.use(authenticateToken, requireAdmin);
adminBannerRouter.get('/', list);
adminBannerRouter.get('/:id', detail);
adminBannerRouter.post('/', uploadBannerMedia, save);
adminBannerRouter.put('/:id', uploadBannerMedia, save);
adminBannerRouter.patch('/reorder', reorder);
adminBannerRouter.patch('/:id/status', status);
adminBannerRouter.delete('/:id', remove);
