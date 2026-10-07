import { Router } from 'express';
import { login, me, register } from '../../controllers/auth.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { requestReset, verifyReset, completeReset } from '../../controllers/passwordReset.controller.js';
import { passwordResetRateLimit } from '../../middlewares/passwordResetRateLimit.middleware.js';
import { startGoogleLogin, googleCallback, completeGoogleLogin } from '../../controllers/googleAuth.controller.js';

const router = Router();

router.get('/google', startGoogleLogin);
router.get('/google/callback', googleCallback);
router.post('/google/exchange', completeGoogleLogin);

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, me);
router.post('/forgot-password', passwordResetRateLimit, requestReset);
router.post('/verify-reset-otp', passwordResetRateLimit, verifyReset);
router.post('/reset-password', passwordResetRateLimit, completeReset);

export default router;
