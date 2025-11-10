/*
  Warnings:

  - You are about to drop the column `formatId` on the `courts` table. All the data in the column will be lost.
  - Added the required column `vendorId` to the `format_types` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "court_formats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "courtId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "maxSlots" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "court_formats_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "court_formats_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "formatId" TEXT,
    "slotNumber" INTEGER,
    "date" DATETIME NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("courtId", "createdAt", "date", "endTime", "id", "notes", "startTime", "status", "totalAmount", "updatedAt", "userId") SELECT "courtId", "createdAt", "date", "endTime", "id", "notes", "startTime", "status", "totalAmount", "updatedAt", "userId" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX "bookings_courtId_idx" ON "bookings"("courtId");
CREATE INDEX "bookings_formatId_idx" ON "bookings"("formatId");
CREATE INDEX "bookings_date_idx" ON "bookings"("date");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
CREATE INDEX "bookings_courtId_formatId_slotNumber_idx" ON "bookings"("courtId", "formatId", "slotNumber");
CREATE TABLE "new_courts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "courtNumber" TEXT NOT NULL,
    "description" TEXT,
    "surface" TEXT,
    "pricePerHour" DECIMAL NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxPlayers" INTEGER NOT NULL DEFAULT 10,
    "features" TEXT,
    "length" DECIMAL,
    "width" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "courts_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_courts" ("courtNumber", "createdAt", "description", "features", "id", "isActive", "maxPlayers", "name", "pricePerHour", "sportId", "surface", "updatedAt", "venueId") SELECT "courtNumber", "createdAt", "description", "features", "id", "isActive", "maxPlayers", "name", "pricePerHour", "sportId", "surface", "updatedAt", "venueId" FROM "courts";
DROP TABLE "courts";
ALTER TABLE "new_courts" RENAME TO "courts";
CREATE INDEX "courts_venueId_idx" ON "courts"("venueId");
CREATE INDEX "courts_sportId_idx" ON "courts"("sportId");
CREATE INDEX "courts_isActive_idx" ON "courts"("isActive");
CREATE INDEX "courts_venueId_isActive_idx" ON "courts"("venueId", "isActive");
CREATE INDEX "courts_sportId_isActive_idx" ON "courts"("sportId", "isActive");
CREATE INDEX "courts_venueId_sportId_isActive_idx" ON "courts"("venueId", "sportId", "isActive");
CREATE UNIQUE INDEX "courts_venueId_courtNumber_key" ON "courts"("venueId", "courtNumber");
CREATE TABLE "new_format_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "minPlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "format_types_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "format_types_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_format_types" ("createdAt", "description", "displayName", "id", "isActive", "maxPlayers", "minPlayers", "name", "sportId", "updatedAt") SELECT "createdAt", "description", "displayName", "id", "isActive", "maxPlayers", "minPlayers", "name", "sportId", "updatedAt" FROM "format_types";
DROP TABLE "format_types";
ALTER TABLE "new_format_types" RENAME TO "format_types";
CREATE INDEX "format_types_vendorId_idx" ON "format_types"("vendorId");
CREATE INDEX "format_types_sportId_idx" ON "format_types"("sportId");
CREATE INDEX "format_types_vendorId_sportId_idx" ON "format_types"("vendorId", "sportId");
CREATE UNIQUE INDEX "format_types_vendorId_sportId_name_key" ON "format_types"("vendorId", "sportId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "court_formats_courtId_idx" ON "court_formats"("courtId");

-- CreateIndex
CREATE INDEX "court_formats_formatId_idx" ON "court_formats"("formatId");

-- CreateIndex
CREATE UNIQUE INDEX "court_formats_courtId_formatId_key" ON "court_formats"("courtId", "formatId");
