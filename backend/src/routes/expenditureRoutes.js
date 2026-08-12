import { Router } from 'express';
import { createExpenditure, getExpenditures } from '../controllers/expenditureController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createExpenditureSchema } from '../validators/expenditureValidators.js';

const router = Router();

router.get('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), enforceBaseScope, getExpenditures);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), enforceBaseScope, validate(createExpenditureSchema), createExpenditure);

export default router;
