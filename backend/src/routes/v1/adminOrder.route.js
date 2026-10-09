import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import * as controller from '../../controllers/adminOrder.controller.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', controller.stats);
router.get('/', controller.list);
router.get('/:id', controller.detail);
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/shipping', controller.updateShipping);

export default router;
