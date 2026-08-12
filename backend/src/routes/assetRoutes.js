import { Router } from 'express';
import { getDashboardMetrics, getBases, getEquipmentTypes } from '../controllers/assetController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { enforceBaseScope } from '../middlewares/rbacMiddleware.js';

const router = Router();

router.get('/dashboard', authenticateToken, enforceBaseScope, getDashboardMetrics);
router.get('/bases', authenticateToken, getBases);
router.get('/equipment-types', authenticateToken, getEquipmentTypes);

export default router;
