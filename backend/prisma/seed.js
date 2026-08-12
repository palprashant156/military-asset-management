import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Bases ───────────────────────────────────────────────────────────────
  const fortAlpha = await prisma.base.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'Fort Alpha', location: 'Northern Region, Sector 7' },
  });

  const fortBravo = await prisma.base.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'Fort Bravo', location: 'Eastern Region, Sector 12' },
  });

  const fortCharlie = await prisma.base.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Fort Charlie', location: 'Southern Region, Sector 3' },
  });

  console.log('✅ Bases created');

  // ─── Equipment Types ─────────────────────────────────────────────────────
  const m4Carbine = await prisma.equipmentType.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'M4 Carbine', category: 'WEAPON' },
  });

  const m9Pistol = await prisma.equipmentType.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'M9 Pistol', category: 'WEAPON' },
  });

  const humvee = await prisma.equipmentType.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, name: 'Humvee HMMWV', category: 'VEHICLE' },
  });

  const mrap = await prisma.equipmentType.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, name: 'MRAP Vehicle', category: 'VEHICLE' },
  });

  const ammo556 = await prisma.equipmentType.upsert({
    where: { id: 5 },
    update: {},
    create: { id: 5, name: '5.56mm NATO Ammo (Rounds)', category: 'AMMUNITION' },
  });

  const ammo762 = await prisma.equipmentType.upsert({
    where: { id: 6 },
    update: {},
    create: { id: 6, name: '7.62mm NATO Ammo (Rounds)', category: 'AMMUNITION' },
  });

  console.log('✅ Equipment types created');

  // ─── Users ───────────────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);

  await prisma.user.upsert({
    where: { username: 'admin_user' },
    update: {},
    create: {
      username: 'admin_user',
      passwordHash: await bcrypt.hash('AdminPass123!', salt),
      role: 'ADMIN',
      baseId: null,
    },
  });

  await prisma.user.upsert({
    where: { username: 'commander_alpha' },
    update: {},
    create: {
      username: 'commander_alpha',
      passwordHash: await bcrypt.hash('CommandPass123!', salt),
      role: 'BASE_COMMANDER',
      baseId: fortAlpha.id,
    },
  });

  await prisma.user.upsert({
    where: { username: 'logistics_officer' },
    update: {},
    create: {
      username: 'logistics_officer',
      passwordHash: await bcrypt.hash('LogisticsPass123!', salt),
      role: 'LOGISTICS_OFFICER',
      baseId: null,
    },
  });

  console.log('✅ Users created');

  // ─── Sample Purchases ────────────────────────────────────────────────────
  const purchases = [
    { baseId: 1, equipmentTypeId: 1, quantity: 200, date: new Date('2025-01-15') },
    { baseId: 1, equipmentTypeId: 5, quantity: 50000, date: new Date('2025-01-15') },
    { baseId: 1, equipmentTypeId: 3, quantity: 15, date: new Date('2025-02-01') },
    { baseId: 2, equipmentTypeId: 1, quantity: 150, date: new Date('2025-01-20') },
    { baseId: 2, equipmentTypeId: 2, quantity: 80, date: new Date('2025-01-20') },
    { baseId: 2, equipmentTypeId: 6, quantity: 30000, date: new Date('2025-02-10') },
    { baseId: 3, equipmentTypeId: 4, quantity: 10, date: new Date('2025-01-25') },
    { baseId: 3, equipmentTypeId: 5, quantity: 25000, date: new Date('2025-02-15') },
    { baseId: 3, equipmentTypeId: 1, quantity: 100, date: new Date('2025-03-01') },
  ];

  for (const p of purchases) {
    await prisma.purchase.create({ data: p });
    // Update Asset table
    await prisma.asset.upsert({
      where: { baseId_equipmentTypeId: { baseId: p.baseId, equipmentTypeId: p.equipmentTypeId } },
      update: { quantity: { increment: p.quantity } },
      create: { baseId: p.baseId, equipmentTypeId: p.equipmentTypeId, quantity: p.quantity },
    });
  }

  console.log('✅ Purchases created');

  // ─── Sample Transfers ────────────────────────────────────────────────────
  const adminUser = await prisma.user.findUnique({ where: { username: 'admin_user' } });

  const transfers = [
    { sourceBaseId: 1, destinationBaseId: 2, equipmentTypeId: 1, quantity: 30, timestamp: new Date('2025-03-10') },
    { sourceBaseId: 2, destinationBaseId: 3, equipmentTypeId: 6, quantity: 5000, timestamp: new Date('2025-03-15') },
    { sourceBaseId: 1, destinationBaseId: 3, equipmentTypeId: 3, quantity: 3, timestamp: new Date('2025-04-01') },
  ];

  for (const t of transfers) {
    await prisma.transfer.create({
      data: { ...t, initiatedBy: adminUser.id, status: 'COMPLETED' },
    });
    // Update source asset
    await prisma.asset.update({
      where: { baseId_equipmentTypeId: { baseId: t.sourceBaseId, equipmentTypeId: t.equipmentTypeId } },
      data: { quantity: { decrement: t.quantity } },
    });
    // Update destination asset
    await prisma.asset.upsert({
      where: { baseId_equipmentTypeId: { baseId: t.destinationBaseId, equipmentTypeId: t.equipmentTypeId } },
      update: { quantity: { increment: t.quantity } },
      create: { baseId: t.destinationBaseId, equipmentTypeId: t.equipmentTypeId, quantity: t.quantity },
    });
  }

  console.log('✅ Transfers created');

  // ─── Sample Assignments ──────────────────────────────────────────────────
  const assignments = [
    { baseId: 1, equipmentTypeId: 1, quantity: 25, assignedTo: 'Sgt. Johnson', date: new Date('2025-04-10') },
    { baseId: 2, equipmentTypeId: 2, quantity: 10, assignedTo: 'Lt. Williams', date: new Date('2025-04-12') },
    { baseId: 3, equipmentTypeId: 4, quantity: 2, assignedTo: 'Cpl. Davis', date: new Date('2025-04-15') },
  ];

  for (const a of assignments) {
    await prisma.assignment.create({ data: a });
    await prisma.asset.update({
      where: { baseId_equipmentTypeId: { baseId: a.baseId, equipmentTypeId: a.equipmentTypeId } },
      data: { quantity: { decrement: a.quantity } },
    });
  }

  console.log('✅ Assignments created');

  // ─── Sample Expenditures ─────────────────────────────────────────────────
  const expenditures = [
    { baseId: 1, equipmentTypeId: 5, quantity: 5000, description: 'Range training exercise', date: new Date('2025-04-20') },
    { baseId: 2, equipmentTypeId: 6, quantity: 3000, description: 'Field exercise qualification', date: new Date('2025-04-22') },
    { baseId: 3, equipmentTypeId: 5, quantity: 2000, description: 'Defensive drill', date: new Date('2025-04-25') },
  ];

  for (const e of expenditures) {
    await prisma.expenditure.create({ data: e });
    await prisma.asset.update({
      where: { baseId_equipmentTypeId: { baseId: e.baseId, equipmentTypeId: e.equipmentTypeId } },
      data: { quantity: { decrement: e.quantity } },
    });
  }

  console.log('✅ Expenditures created');

  // ─── Sample Audit Logs ───────────────────────────────────────────────────
  const auditEntries = [
    { userId: adminUser.id, action: 'PURCHASE', details: 'Purchased 200x M4 Carbine for Fort Alpha' },
    { userId: adminUser.id, action: 'TRANSFER', details: 'Transferred 30x M4 Carbine from Fort Alpha to Fort Bravo' },
    { userId: adminUser.id, action: 'ASSIGNMENT', details: 'Assigned 25x M4 Carbine to Sgt. Johnson at Fort Alpha' },
    { userId: adminUser.id, action: 'EXPENDITURE', details: 'Expended 5000x 5.56mm NATO Ammo at Fort Alpha: Range training exercise' },
  ];

  for (const log of auditEntries) {
    await prisma.auditLog.create({ data: log });
  }

  console.log('✅ Audit logs created');
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
