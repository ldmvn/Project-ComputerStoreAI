import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import { add, create, detail, home, list, products, remove, removeItem, reorder, reorderItems, sectionProducts, status, update } from '../../controllers/productSection.controller.js';

export const publicProductSectionRouter = Router();
publicProductSectionRouter.get('/home', home);

export const adminProductSectionRouter = Router();
adminProductSectionRouter.use(authenticateToken, requireAdmin);
adminProductSectionRouter.get('/products', products);
adminProductSectionRouter.get('/', list);
adminProductSectionRouter.get('/:id', detail);
adminProductSectionRouter.get('/:id/products', sectionProducts);
adminProductSectionRouter.post('/', create);
adminProductSectionRouter.put('/:id', update);
adminProductSectionRouter.delete('/:id', remove);
adminProductSectionRouter.patch('/reorder', reorder);
adminProductSectionRouter.patch('/:id/status', status);
adminProductSectionRouter.post('/:id/products', add);
adminProductSectionRouter.patch('/:id/products/reorder', reorderItems);
adminProductSectionRouter.patch('/:id/reorder-products', reorderItems);
adminProductSectionRouter.delete('/:id/products/:productId', removeItem);
