-- AlterTable
ALTER TABLE "users" ADD COLUMN "city" TEXT;
ALTER TABLE "users" ADD COLUMN "country" TEXT;
ALTER TABLE "users" ADD COLUMN "countryCode" TEXT;
ALTER TABLE "users" ADD COLUMN "currencyCode" TEXT;
ALTER TABLE "users" ADD COLUMN "locale" TEXT;
ALTER TABLE "users" ADD COLUMN "state" TEXT;
ALTER TABLE "users" ADD COLUMN "timezone" TEXT;

-- CreateIndex
CREATE INDEX "users_countryCode_idx" ON "users"("countryCode");

-- CreateIndex
CREATE INDEX "users_city_idx" ON "users"("city");
