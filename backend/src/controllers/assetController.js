import prisma from '../config/db.js';

/**
 * GET /api/assets/dashboard
 * Returns aggregated inventory metrics using CTE-based raw query.
 * Supports filters: baseId, equipmentTypeId, startDate, endDate.
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    const { baseId, equipmentTypeId, startDate, endDate } = req.query;

    const bId = baseId ? Number(baseId) : null;
    const eId = equipmentTypeId ? Number(equipmentTypeId) : null;
    const sDate = startDate ? new Date(startDate) : new Date('1970-01-01');
    const eDate = endDate ? new Date(endDate) : new Date();

    const result = await prisma.$queryRaw`
      WITH
        -- Opening Balance components (before startDate)
        opening_purchases AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM purchases
          WHERE (${bId}::int IS NULL OR "baseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND date < ${sDate}
        ),
        opening_transfers_in AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM transfers
          WHERE (${bId}::int IS NULL OR "destinationBaseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND timestamp < ${sDate}
            AND status = 'COMPLETED'
        ),
        opening_transfers_out AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM transfers
          WHERE (${bId}::int IS NULL OR "sourceBaseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND timestamp < ${sDate}
            AND status = 'COMPLETED'
        ),
        opening_assignments AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM assignments
          WHERE (${bId}::int IS NULL OR "baseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND date < ${sDate}
        ),
        opening_expenditures AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM expenditures
          WHERE (${bId}::int IS NULL OR "baseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND date < ${sDate}
        ),

        -- Period components (startDate to endDate)
        period_purchases AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM purchases
          WHERE (${bId}::int IS NULL OR "baseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND date >= ${sDate} AND date <= ${eDate}
        ),
        period_transfers_in AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM transfers
          WHERE (${bId}::int IS NULL OR "destinationBaseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND timestamp >= ${sDate} AND timestamp <= ${eDate}
            AND status = 'COMPLETED'
        ),
        period_transfers_out AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM transfers
          WHERE (${bId}::int IS NULL OR "sourceBaseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND timestamp >= ${sDate} AND timestamp <= ${eDate}
            AND status = 'COMPLETED'
        ),
        period_assignments AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM assignments
          WHERE (${bId}::int IS NULL OR "baseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND date >= ${sDate} AND date <= ${eDate}
        ),
        period_expenditures AS (
          SELECT COALESCE(SUM(quantity), 0)::int AS val
          FROM expenditures
          WHERE (${bId}::int IS NULL OR "baseId" = ${bId})
            AND (${eId}::int IS NULL OR "equipmentTypeId" = ${eId})
            AND date >= ${sDate} AND date <= ${eDate}
        )

      SELECT
        (op.val + oti.val - oto.val - oa.val - oe.val) AS "openingBalance",
        pp.val AS "purchases",
        pti.val AS "transfersIn",
        pto.val AS "transfersOut",
        (pp.val + pti.val - pto.val) AS "netMovement",
        pa.val AS "assigned",
        pe.val AS "expended",
        (op.val + oti.val - oto.val - oa.val - oe.val
         + pp.val + pti.val - pto.val - pa.val - pe.val) AS "closingBalance"
      FROM
        opening_purchases op,
        opening_transfers_in oti,
        opening_transfers_out oto,
        opening_assignments oa,
        opening_expenditures oe,
        period_purchases pp,
        period_transfers_in pti,
        period_transfers_out pto,
        period_assignments pa,
        period_expenditures pe
    `;

    return res.status(200).json({
      success: true,
      data: result[0] || {
        openingBalance: 0,
        purchases: 0,
        transfersIn: 0,
        transfersOut: 0,
        netMovement: 0,
        assigned: 0,
        expended: 0,
        closingBalance: 0,
      },
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * GET /api/assets/bases
 * List all bases.
 */
export const getBases = async (req, res) => {
  try {
    const bases = await prisma.base.findMany({
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: bases,
    });
  } catch (error) {
    console.error('Get bases error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bases', code: 'INTERNAL_ERROR' });
  }
};

/**
 * GET /api/assets/equipment-types
 * List all equipment types.
 */
export const getEquipmentTypes = async (req, res) => {
  try {
    const types = await prisma.equipmentType.findMany({
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error('Get equipment types error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch equipment types', code: 'INTERNAL_ERROR' });
  }
};
