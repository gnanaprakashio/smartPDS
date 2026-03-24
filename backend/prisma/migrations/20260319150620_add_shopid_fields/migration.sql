-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('PDS_OFFICER', 'STAFF');

-- CreateEnum
CREATE TYPE "FraudSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('AAY', 'PHH', 'NPHH');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'MISSED');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "rationCardNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "slotNumber" INTEGER,
    "timeSlot" TEXT,
    "scheduleDate" TIMESTAMP(3),
    "otp" TEXT,
    "otpExpiry" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'STAFF',
    "shopId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "riceStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugarStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wheatStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "oilStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "slotDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxUsers" INTEGER NOT NULL,
    "shopId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slot_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "slot_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL,
    "scoreChange" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reputation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" "FraudSeverity" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_actions" (
    "id" TEXT NOT NULL,
    "fraudLogId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_rationCardNumber_key" ON "users"("rationCardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_rationCardNumber_idx" ON "users"("rationCardNumber");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_shopId_idx" ON "users"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "admins_shopId_idx" ON "admins"("shopId");

-- CreateIndex
CREATE INDEX "inventory_shopId_idx" ON "inventory"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_shopId_key" ON "inventory"("shopId");

-- CreateIndex
CREATE INDEX "slots_slotDate_idx" ON "slots"("slotDate");

-- CreateIndex
CREATE INDEX "slots_shopId_idx" ON "slots"("shopId");

-- CreateIndex
CREATE INDEX "slot_assignments_userId_idx" ON "slot_assignments"("userId");

-- CreateIndex
CREATE INDEX "slot_assignments_slotId_idx" ON "slot_assignments"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "slot_assignments_userId_slotId_key" ON "slot_assignments"("userId", "slotId");

-- CreateIndex
CREATE INDEX "otp_verifications_userId_idx" ON "otp_verifications"("userId");

-- CreateIndex
CREATE INDEX "otp_verifications_createdAt_idx" ON "otp_verifications"("createdAt");

-- CreateIndex
CREATE INDEX "reputation_logs_userId_idx" ON "reputation_logs"("userId");

-- CreateIndex
CREATE INDEX "fraud_logs_userId_idx" ON "fraud_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_actions_fraudLogId_key" ON "admin_actions"("fraudLogId");

-- AddForeignKey
ALTER TABLE "slot_assignments" ADD CONSTRAINT "slot_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_assignments" ADD CONSTRAINT "slot_assignments_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reputation_logs" ADD CONSTRAINT "reputation_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_logs" ADD CONSTRAINT "fraud_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_actions" ADD CONSTRAINT "admin_actions_fraudLogId_fkey" FOREIGN KEY ("fraudLogId") REFERENCES "fraud_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
