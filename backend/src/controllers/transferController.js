import prisma from '../config/db.js';
import { Prisma } from '@prisma/client';

const MAX_RETRIES = 3;

/**
 * Execute a function within a Serializable transaction with retry logic.
 * Handles PostgreSQL serialization failures (P2034 / SQLSTATE 40001).
 */
async function executeWithRetry(fn) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isSerializationFailure =
        (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') ||
        error?.code === '40001';

      if (isSerializationFailure && attempt < MAX_RETRIES) {
        // Brief backoff before retry
        await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
        continue;
      }
      throw error;
    }
  }
}

/**
 * POST /api/transfers
 * Atomic transfer: validate stock → create transfer → update assets → audit log.
 * Uses Serializable isolation with retry on serialization failure.
 */
export const createTransfer = async (req, res) => {
  try {
    const { sourceBaseId, destinationBaseId, equipmentTypeId, quantity } = req.body;
    const userId = req.user.userId;

    // Pre-validate: source base exists
    const sourceBase = await prisma.base.findUnique({ where: { id: sourceBaseId } });
    if (!sourceBase) {
      return res.status(400).json({
        success: false,
        message: 'Source base not found',
        code: 'BASE_NOT_FOUND',
      });
    }

    // Pre-validate: destination base exists
    const destBase = await prisma.base.findUnique({ where: { id: destinationBaseId } });
    if (!destBase) {
      return res.status(400).json({
        success: false,
        message: 'Destination base not found',
        code: 'BASE_NOT_FOUND',
      });
    }

    // Pre-validate: equipment type exists
    const equipmentType = await prisma.equipmentType.findUnique({ where: { id: equipmentTypeId } });
    if (!equipmentType) {
      return res.status(400).json({
        success: false,
        message: 'Equipment type not found',
        code: 'EQUIPMENT_NOT_FOUND',
      });
    }

    // Execute transfer with Serializable isolation and retry
    const result = await executeWithRetry(async () => {
      return await prisma.$transaction(
        async (tx) => {
          // 1. Check source asset stock
          const sourceAsset = await tx.asset.findUnique({
            where: {
              baseId_equipmentTypeId: {
                baseId: sourceBaseId,
                equipmentTypeId,
              },
            },
          });

          const availableStock = sourceAsset?.quantity || 0;
          if (availableStock < quantity) {
            throw Object.assign(new Error('Insufficient stock at source base'), {
              statusCode: 400,
              code: 'INSUFFICIENT_STOCK',
            });
          }

          // 2. Decrement source asset
          await tx.asset.update({
            where: {
              baseId_equipmentTypeId: {
                baseId: sourceBaseId,
                equipmentTypeId,
              },
            },
            data: {
              quantity: { decrement: quantity },
            },
          });

          // 3. Upsert destination asset
          await tx.asset.upsert({
            where: {
              baseId_equipmentTypeId: {
                baseId: destinationBaseId,
                equipmentTypeId,
              },
            },
            update: {
              quantity: { increment: quantity },
            },
            create: {
              baseId: destinationBaseId,
              equipmentTypeId,
              quantity,
            },
          });

          // 4. Create transfer record
          const transfer = await tx.transfer.create({
            data: {
              sourceBaseId,
              destinationBaseId,
              equipmentTypeId,
              quantity,
              initiatedBy: userId,
              status: 'COMPLETED',
            },
            include: {
              sourceBase: true,
              destinationBase: true,
              equipmentType: true,
            },
          });

          // 5. Create audit log
          await tx.auditLog.create({
            data: {
              userId,
              action: 'TRANSFER',
              details: `Transferred ${quantity}x ${equipmentType.name} from ${sourceBase.name} to ${destBase.name}`,
            },
          });

          return transfer;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    });

    return res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      data: result,
    });
  } catch (error) {
    // Handle business-rule errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        code: error.code,
      });
    }

    // Handle serialization failure after all retries exhausted
    const isSerializationFailure =
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') ||
      error?.code === '40001';
    if (isSerializationFailure) {
      return res.status(409).json({
        success: false,
        message: 'Transfer could not be completed due to concurrent modification. Please try again.',
        code: 'CONFLICT',
      });
    }

    console.error('Create transfer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create transfer',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * GET /api/transfers
 * List transfers with optional filters.
 * BASE_COMMANDER sees only transfers involving their base (via scopedBaseId).
 */
export const getTransfers = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate, scopedBaseId, page = 1, limit = 20 } = req.query;

    const where = {};

    // Base Commander scoping — show transfers where their base is source OR destination
    if (scopedBaseId) {
      where.OR = [
        { sourceBaseId: Number(scopedBaseId) },
        { destinationBaseId: Number(scopedBaseId) },
      ];
    } else if (baseId) {
      // Admin/Logistics filtering by specific base
      where.OR = [
        { sourceBaseId: Number(baseId) },
        { destinationBaseId: Number(baseId) },
      ];
    }

    if (equipmentTypeId) where.equipmentTypeId = Number(equipmentTypeId);
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({
        where,
        include: {
          sourceBase: { select: { id: true, name: true } },
          destinationBase: { select: { id: true, name: true } },
          equipmentType: { select: { id: true, name: true, category: true } },
          initiator: { select: { id: true, username: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.transfer.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: transfers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get transfers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transfers',
      code: 'INTERNAL_ERROR',
    });
  }
};
