import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import * as controller from '../../controllers/adminVoucher.controller.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', controller.stats);
router.get('/', controller.list);
router.get('/:id', controller.detail);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.patch('/:id/toggle', controller.toggle);
router.delete('/:id', controller.remove);

export default router;
