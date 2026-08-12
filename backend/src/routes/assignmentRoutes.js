import { Router } from 'express';
import { createAssignment, getAssignments } from '../controllers/assignmentController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeRoles, enforceBaseScope } from '../middlewares/rbacMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { createAssignmentSchema } from '../validators/assignmentValidators.js';

const router = Router();

router.get('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), enforceBaseScope, getAssignments);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'BASE_COMMANDER'), enforceBaseScope, validate(createAssignmentSchema), createAssignment);

export default router;
