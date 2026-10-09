import { Router } from 'express';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { listMine, deleteMine } from '../../controllers/review.controller.js';

const router = Router();
router.use(authenticateToken);
router.get('/me', listMine);
router.delete('/me/:id', deleteMine);

export default router;
