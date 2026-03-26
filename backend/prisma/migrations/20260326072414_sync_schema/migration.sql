-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ALERT', 'FRAUD', 'SUCCESS');

-- CreateEnum
CREATE TYPE "ResetRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "CardType" ADD VALUE 'NPHH_S';

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "reservedOil" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reservedRice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reservedSugar" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reservedToorDal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reservedWheat" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "toorDalStock" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reservedItems" JSONB;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reputation_reset_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "rationCardNumber" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "staffName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ResetRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reputation_reset_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_read_idx" ON "notifications"("read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "reputation_reset_requests_shopId_idx" ON "reputation_reset_requests"("shopId");

-- CreateIndex
CREATE INDEX "reputation_reset_requests_status_idx" ON "reputation_reset_requests"("status");
