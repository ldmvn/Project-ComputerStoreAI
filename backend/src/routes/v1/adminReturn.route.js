import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import * as controller from '../../controllers/adminReturn.controller.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', controller.list);
router.get('/:id', controller.detail);
router.patch('/:id/status', controller.updateStatus);

export default router;
