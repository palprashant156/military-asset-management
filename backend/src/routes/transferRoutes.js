import { Router } from 'express';
import { createTransfer, getTransfers } from '../controllers/transferController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceTransferBaseScope } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createTransferSchema } from '../validators/transferValidators.js';

const router = Router();

router.get('/', authenticateToken, enforceTransferBaseScope, getTransfers);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'LOGISTICS_OFFICER'), validate(createTransferSchema), createTransfer);

export default router;
