import { Router } from 'express';
import { createPurchase, getPurchases } from '../controllers/purchaseController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createPurchaseSchema } from '../validators/purchaseValidators.js';

const router = Router();

router.get('/', authenticateToken, enforceBaseScope, getPurchases);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'), validate(createPurchaseSchema), createPurchase);

export default router;
