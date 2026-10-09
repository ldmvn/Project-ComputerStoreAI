import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import * as controller from '../../controllers/attribute.controller.js';

export const publicAttributeRouter = Router();
publicAttributeRouter.get('/category/:slug', controller.publicByCategory);

export const adminAttributeRouter = Router();
adminAttributeRouter.use(authenticateToken, requireAdmin);
adminAttributeRouter.get('/', controller.list);
adminAttributeRouter.get('/category/:categoryId', controller.byCategory);
adminAttributeRouter.post('/', controller.create);
adminAttributeRouter.put('/:id', controller.update);
adminAttributeRouter.delete('/:id', controller.remove);
adminAttributeRouter.patch('/:id/status', controller.status);
adminAttributeRouter.patch('/:id/order', controller.order);
adminAttributeRouter.put('/:id/categories', controller.categories);
adminAttributeRouter.post('/:id/values', controller.createValue);
adminAttributeRouter.put('/values/:valueId', controller.updateValue);
adminAttributeRouter.delete('/values/:valueId', controller.removeValue);
adminAttributeRouter.patch('/values/:valueId/status', controller.valueStatus);
adminAttributeRouter.patch('/values/:valueId/order', controller.valueOrder);
