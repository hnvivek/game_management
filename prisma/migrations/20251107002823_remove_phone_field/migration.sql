/*
  Warnings:

  - You are about to drop the column `phone` on the `vendors` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "email" TEXT NOT NULL,
    "phoneCountryCode" TEXT,
    "phoneNumber" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "onboardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME,
    "address" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "countryCode" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "primaryColor" TEXT DEFAULT '#3B82F6',
    "secondaryColor" TEXT DEFAULT '#64748B',
    "accentColor" TEXT DEFAULT '#F59E0B',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_vendors" ("accentColor", "address", "autoApprove", "city", "country", "countryCode", "createdAt", "currencyCode", "deletedAt", "description", "email", "id", "isActive", "locale", "logoUrl", "name", "onboardedAt", "phoneCountryCode", "phoneNumber", "postalCode", "primaryColor", "secondaryColor", "slug", "state", "timezone", "updatedAt", "website") SELECT "accentColor", "address", "autoApprove", "city", "country", "countryCode", "createdAt", "currencyCode", "deletedAt", "description", "email", "id", "isActive", "locale", "logoUrl", "name", "onboardedAt", "phoneCountryCode", "phoneNumber", "postalCode", "primaryColor", "secondaryColor", "slug", "state", "timezone", "updatedAt", "website" FROM "vendors";
DROP TABLE "vendors";
ALTER TABLE "new_vendors" RENAME TO "vendors";
CREATE UNIQUE INDEX "vendors_name_key" ON "vendors"("name");
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");
CREATE UNIQUE INDEX "vendors_email_key" ON "vendors"("email");
CREATE INDEX "vendors_slug_idx" ON "vendors"("slug");
CREATE INDEX "vendors_isActive_idx" ON "vendors"("isActive");
CREATE INDEX "vendors_deletedAt_idx" ON "vendors"("deletedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
