import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import * as controller from '../../controllers/adminInventory.controller.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', controller.stats);
router.get('/logs', controller.logs);
router.get('/', controller.list);
router.post('/:id/import', controller.importStock);
router.post('/:id/adjust', controller.adjustStock);

export default router;
