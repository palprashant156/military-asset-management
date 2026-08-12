import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';

const MAX_RETRIES = 3;

async function executeWithRetry(fn) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isSerializationFailure =
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') ||
        error?.code === '40001';
      if (isSerializationFailure && attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
        continue;
      }
      throw error;
    }
  }
}

/**
 * POST /api/expenditures
 * Record expenditure — validates stock, creates record, updates asset, logs audit.
 */
export const createExpenditure = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, quantity, description, date } = req.body;
    const userId = req.user.userId;

    const base = await prisma.base.findUnique({ where: { id: baseId } });
    if (!base) {
      return res.status(400).json({ success: false, message: 'Base not found', code: 'BASE_NOT_FOUND' });
    }

    const equipmentType = await prisma.equipmentType.findUnique({ where: { id: equipmentTypeId } });
    if (!equipmentType) {
      return res.status(400).json({ success: false, message: 'Equipment type not found', code: 'EQUIPMENT_NOT_FOUND' });
    }

    const result = await executeWithRetry(async () => {
      return await prisma.$transaction(
        async (tx) => {
          const asset = await tx.asset.findUnique({
            where: { baseId_equipmentTypeId: { baseId, equipmentTypeId } },
          });

          const availableStock = asset?.quantity || 0;
          if (availableStock < quantity) {
            throw Object.assign(new Error('Insufficient stock for expenditure'), {
              statusCode: 400,
              code: 'INSUFFICIENT_STOCK',
            });
          }

          await tx.asset.update({
            where: { baseId_equipmentTypeId: { baseId, equipmentTypeId } },
            data: { quantity: { decrement: quantity } },
          });

          const expenditure = await tx.expenditure.create({
            data: {
              baseId,
              equipmentTypeId,
              quantity,
              description,
              date: date ? new Date(date) : new Date(),
            },
            include: {
              base: true,
              equipmentType: true,
            },
          });

          await tx.auditLog.create({
            data: {
              userId,
              action: 'EXPENDITURE',
              details: `Expended ${quantity}x ${equipmentType.name} at ${base.name}: ${description}`,
            },
          });

          return expenditure;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    });

    return res.status(201).json({
      success: true,
      message: 'Expenditure recorded successfully',
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message, code: error.code });
    }
    const isSerializationFailure =
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') || error?.code === '40001';
    if (isSerializationFailure) {
      return res.status(409).json({ success: false, message: 'Concurrent modification conflict. Please try again.', code: 'CONFLICT' });
    }
    console.error('Create expenditure error:', error);
    return res.status(500).json({ success: false, message: 'Failed to record expenditure', code: 'INTERNAL_ERROR' });
  }
};

/**
 * GET /api/expenditures
 * List expenditures with filters.
 */
export const getExpenditures = async (req, res) => {
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

    const [expenditures, total] = await Promise.all([
      prisma.expenditure.findMany({
        where,
        include: {
          base: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true, category: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.expenditure.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: expenditures,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('Get expenditures error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch expenditures', code: 'INTERNAL_ERROR' });
  }
};
