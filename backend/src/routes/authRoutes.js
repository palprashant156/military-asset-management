import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../validators/authValidators.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit login: 10 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
    code: 'RATE_LIMITED',
  },
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', authenticateToken, getMe);

export default router;
