-- AlterTable
ALTER TABLE "vendor_settings" ADD COLUMN "emailNotificationSettings" TEXT;
ALTER TABLE "vendor_settings" ADD COLUMN "paymentSettings" TEXT;
ALTER TABLE "vendor_settings" ADD COLUMN "smsNotificationSettings" TEXT;
ALTER TABLE "vendor_settings" ADD COLUMN "taxId" TEXT;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN "phone" TEXT;

-- CreateTable
CREATE TABLE "vendor_operating_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "vendor_operating_hours_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "vendor_operating_hours_vendorId_idx" ON "vendor_operating_hours"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_operating_hours_vendorId_dayOfWeek_key" ON "vendor_operating_hours"("vendorId", "dayOfWeek");
