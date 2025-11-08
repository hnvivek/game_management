-- AlterTable
ALTER TABLE "users" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "venues" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "vendors_deletedAt_idx" ON "vendors"("deletedAt");

-- CreateIndex
CREATE INDEX "venues_deletedAt_idx" ON "venues"("deletedAt");
