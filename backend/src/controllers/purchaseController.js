import prisma from '../config/db.js';

/**
 * POST /api/purchases
 * Create a new purchase — inserts purchase record + updates Asset + creates audit log
 * in a single transaction.
 */
export const createPurchase = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, quantity, date } = req.body;
    const userId = req.user.userId;

    // Verify base exists
    const base = await prisma.base.findUnique({ where: { id: baseId } });
    if (!base) {
      return res.status(400).json({
        success: false,
        message: 'Base not found',
        code: 'BASE_NOT_FOUND',
      });
    }

    // Verify equipment type exists
    const equipmentType = await prisma.equipmentType.findUnique({ where: { id: equipmentTypeId } });
    if (!equipmentType) {
      return res.status(400).json({
        success: false,
        message: 'Equipment type not found',
        code: 'EQUIPMENT_NOT_FOUND',
      });
    }

    // Execute transaction: create purchase + update asset + create audit log
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          baseId,
          equipmentTypeId,
          quantity,
          date: date ? new Date(date) : new Date(),
        },
        include: {
          base: true,
          equipmentType: true,
        },
      });

      // 2. Upsert asset (create if doesn't exist, increment quantity if exists)
      await tx.asset.upsert({
        where: {
          baseId_equipmentTypeId: { baseId, equipmentTypeId },
        },
        update: {
          quantity: { increment: quantity },
        },
        create: {
          baseId,
          equipmentTypeId,
          quantity,
        },
      });

      // 3. Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'PURCHASE',
          details: `Purchased ${quantity}x ${equipmentType.name} for ${base.name}`,
        },
      });

      return purchase;
    });

    return res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: result,
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create purchase',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * GET /api/purchases
 * List purchases with optional filters: baseId, equipmentTypeId, startDate, endDate.
 * Paginated with page & limit query params.
 */
export const getPurchases = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const where = {};
    if (baseId) where.baseId = Number(baseId);
    if (equipmentTypeId) where.equipmentTypeId = Number(equipmentTypeId);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          base: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true, category: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.purchase.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: purchases,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch purchases',
      code: 'INTERNAL_ERROR',
    });
  }
};
