import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requireAdmin } from '../../middlewares/admin.middleware.js';
import * as controller from '../../controllers/adminReport.controller.js';

const router = Router();
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', controller.summary);
router.get('/revenue', controller.revenue);
router.get('/top-products', controller.topProducts);
router.get('/daily', controller.dailyRevenue);

export default router;
