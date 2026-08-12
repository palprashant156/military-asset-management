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
 * POST /api/assignments
 * Create assignment — validates stock, creates record, updates asset, logs audit.
 */
export const createAssignment = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, quantity, assignedTo, date } = req.body;
    const userId = req.user.userId;

    // Verify base and equipment
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
          // 1. Check available stock
          const asset = await tx.asset.findUnique({
            where: { baseId_equipmentTypeId: { baseId, equipmentTypeId } },
          });

          const availableStock = asset?.quantity || 0;
          if (availableStock < quantity) {
            throw Object.assign(new Error('Insufficient stock for assignment'), {
              statusCode: 400,
              code: 'INSUFFICIENT_STOCK',
            });
          }

          // 2. Decrement asset
          await tx.asset.update({
            where: { baseId_equipmentTypeId: { baseId, equipmentTypeId } },
            data: { quantity: { decrement: quantity } },
          });

          // 3. Create assignment
          const assignment = await tx.assignment.create({
            data: {
              baseId,
              equipmentTypeId,
              quantity,
              assignedTo,
              date: date ? new Date(date) : new Date(),
            },
            include: {
              base: true,
              equipmentType: true,
            },
          });

          // 4. Audit log
          await tx.auditLog.create({
            data: {
              userId,
              action: 'ASSIGNMENT',
              details: `Assigned ${quantity}x ${equipmentType.name} to ${assignedTo} at ${base.name}`,
            },
          });

          return assignment;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    });

    return res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
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
    console.error('Create assignment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create assignment', code: 'INTERNAL_ERROR' });
  }
};

/**
 * GET /api/assignments
 * List assignments with filters.
 */
export const getAssignments = async (req, res) => {
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

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          base: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true, category: true } },
        },
        orderBy: { date: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.assignment.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: assignments,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments', code: 'INTERNAL_ERROR' });
  }
};
