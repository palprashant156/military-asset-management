/**
 * Middleware: Validate request body against a Zod schema.
 * Returns 400 with structured error details on failure.
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors,
      });
    }

    // Replace body with parsed/transformed data
    req.body = result.data;
    next();
  };
};
