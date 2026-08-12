import prisma from '../config/db.js';

/**
 * GET /api/audit-logs
 * List audit logs (ADMIN only). Paginated, filterable by action, userId, date range.
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { action, userId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};
    if (action) where.action = action;
    if (userId) where.userId = Number(userId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      code: 'INTERNAL_ERROR',
    });
  }
};
