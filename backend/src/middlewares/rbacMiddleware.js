/**
 * Middleware: Restrict access based on user role.
 * Usage: authorizeRoles('ADMIN', 'LOGISTICS_OFFICER')
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient authorization level',
        code: 'FORBIDDEN',
      });
    }
    next();
  };
};

/**
 * Middleware: Enforce base isolation for BASE_COMMANDER.
 *
 * - GET: Injects user's baseId into query, ignoring any client-provided value.
 * - POST: Validates req.body.baseId matches user's assigned base.
 * - Admins and Logistics Officers pass through unmodified.
 */
export const enforceBaseScope = (req, res, next) => {
  if (req.user.role !== 'BASE_COMMANDER') {
    return next();
  }

  const userBaseId = req.user.baseId;

  if (req.method === 'GET') {
    // Force query scope — override any client-provided baseId
    req.query.baseId = String(userBaseId);
  } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // For mutations, validate that the target base matches the user's base
    if (req.body.baseId && Number(req.body.baseId) !== userBaseId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: base isolation violation',
        code: 'BASE_ISOLATION_VIOLATION',
      });
    }
    // Inject baseId if not provided
    if (!req.body.baseId) {
      req.body.baseId = userBaseId;
    }
  }

  next();
};

/**
 * Middleware: Enforce base scope specifically for transfer views.
 * BASE_COMMANDER can only see transfers where their base is source or destination.
 */
export const enforceTransferBaseScope = (req, res, next) => {
  if (req.user.role !== 'BASE_COMMANDER') {
    return next();
  }

  // Mark that transfer queries should be filtered by this base
  req.query.scopedBaseId = String(req.user.baseId);
  next();
};
