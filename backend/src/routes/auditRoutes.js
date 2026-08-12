import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/rbacMiddleware.js';

const router = Router();

// Admin only
router.get('/', authenticateToken, authorizeRoles('ADMIN'), getAuditLogs);

export default router;
