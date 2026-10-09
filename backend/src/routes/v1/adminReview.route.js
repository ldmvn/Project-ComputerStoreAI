import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import * as controller from '../../controllers/adminReview.controller.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', controller.stats);
router.get('/', controller.list);
router.patch('/:id/publish', controller.publish);
router.patch('/:id/hide', controller.hide);
router.delete('/:id', controller.remove);

export default router;
