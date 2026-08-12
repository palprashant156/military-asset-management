-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('WEAPON', 'VEHICLE', 'AMMUNITION');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('PURCHASE', 'TRANSFER', 'ASSIGNMENT', 'EXPENDITURE');

-- CreateTable
CREATE TABLE "bases" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "location" VARCHAR(150) NOT NULL,

    CONSTRAINT "bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "baseId" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" "Category" NOT NULL,

    CONSTRAINT "equipment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" SERIAL NOT NULL,
    "baseId" INTEGER NOT NULL,
    "equipmentTypeId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseId" INTEGER NOT NULL,
    "equipmentTypeId" INTEGER NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'COMPLETED',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceBaseId" INTEGER NOT NULL,
    "destinationBaseId" INTEGER NOT NULL,
    "equipmentTypeId" INTEGER NOT NULL,
    "initiatedBy" INTEGER NOT NULL,

    CONSTRAINT "transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "assignedTo" VARCHAR(100) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseId" INTEGER NOT NULL,
    "equipmentTypeId" INTEGER NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenditures" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseId" INTEGER NOT NULL,
    "equipmentTypeId" INTEGER NOT NULL,

    CONSTRAINT "expenditures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "action" "AuditAction" NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "assets_baseId_idx" ON "assets"("baseId");

-- CreateIndex
CREATE INDEX "assets_equipmentTypeId_idx" ON "assets"("equipmentTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "assets_baseId_equipmentTypeId_key" ON "assets"("baseId", "equipmentTypeId");

-- CreateIndex
CREATE INDEX "purchases_baseId_equipmentTypeId_date_idx" ON "purchases"("baseId", "equipmentTypeId", "date");

-- CreateIndex
CREATE INDEX "transfers_sourceBaseId_equipmentTypeId_timestamp_idx" ON "transfers"("sourceBaseId", "equipmentTypeId", "timestamp");

-- CreateIndex
CREATE INDEX "transfers_destinationBaseId_equipmentTypeId_timestamp_idx" ON "transfers"("destinationBaseId", "equipmentTypeId", "timestamp");

-- CreateIndex
CREATE INDEX "assignments_baseId_equipmentTypeId_date_idx" ON "assignments"("baseId", "equipmentTypeId", "date");

-- CreateIndex
CREATE INDEX "expenditures_baseId_equipmentTypeId_date_idx" ON "expenditures"("baseId", "equipmentTypeId", "date");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "equipment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "equipment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_sourceBaseId_fkey" FOREIGN KEY ("sourceBaseId") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_destinationBaseId_fkey" FOREIGN KEY ("destinationBaseId") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "equipment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_initiatedBy_fkey" FOREIGN KEY ("initiatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "equipment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_baseId_fkey" FOREIGN KEY ("baseId") REFERENCES "bases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenditures" ADD CONSTRAINT "expenditures_equipmentTypeId_fkey" FOREIGN KEY ("equipmentTypeId") REFERENCES "equipment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
