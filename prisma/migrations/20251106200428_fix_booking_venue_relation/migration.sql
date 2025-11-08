-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_bookings" ("courtId", "createdAt", "date", "endTime", "id", "notes", "startTime", "status", "totalAmount", "updatedAt", "userId") SELECT "courtId", "createdAt", "date", "endTime", "id", "notes", "startTime", "status", "totalAmount", "updatedAt", "userId" FROM "bookings";
DROP TABLE "bookings";
ALTER TABLE "new_bookings" RENAME TO "bookings";
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX "bookings_courtId_idx" ON "bookings"("courtId");
CREATE INDEX "bookings_date_idx" ON "bookings"("date");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
