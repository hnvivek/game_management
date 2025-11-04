/*
  Warnings:

  - You are about to drop the `match_bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `simple_bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `venueId` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `preferredRole` on the `player_skills` table. All the data in the column will be lost.
  - You are about to drop the column `autoApprove` on the `team_invites` table. All the data in the column will be lost.
  - You are about to drop the column `defaultRole` on the `team_invites` table. All the data in the column will be lost.
  - You are about to drop the column `inviteType` on the `team_invites` table. All the data in the column will be lost.
  - You are about to drop the column `invitedBy` on the `team_invites` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `team_invites` table. All the data in the column will be lost.
  - You are about to drop the column `maxUses` on the `team_invites` table. All the data in the column will be lost.
  - You are about to drop the column `team_invite_code` on the `team_invites` table. All the data in the column will be lost.
  - You are about to drop the column `usesCount` on the `team_invites` table. All the data in the column will be lost.
  - You are about to drop the column `area` on the `teams` table. All the data in the column will be lost.
  - You are about to drop the column `amountPaid` on the `tournament_participants` table. All the data in the column will be lost.
  - You are about to drop the column `assignedTeam` on the `tournament_participants` table. All the data in the column will be lost.
  - You are about to drop the column `jerseyNumber` on the `tournament_participants` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `tournament_participants` table. All the data in the column will be lost.
  - You are about to drop the column `adaptiveMode` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `allowPublicJoin` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `currentPlayers` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `finalTeamSize` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `maxPlayers` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `minPlayers` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerPlayer` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `skillLevel` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `targetTeams` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `tournamentType` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `tournament_code` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the column `area` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_slug` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `courtNumber` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the column `formatId` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the column `maxPlayers` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerHour` on the `venues` table. All the data in the column will be lost.
  - You are about to drop the column `sportId` on the `venues` table. All the data in the column will be lost.
  - Added the required column `courtId` to the `matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverId` to the `team_invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `team_invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `team_invites` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `team_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `tournament_participants` table without a default value. This is not possible if the table is not empty.
  - Added the required column `format` to the `tournaments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxTeams` to the `tournaments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `tournaments` table without a default value. This is not possible if the table is not empty.
  - Made the column `registrationDeadline` on table `tournaments` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `countryCode` to the `vendors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currencyCode` to the `vendors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locale` to the `vendors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `vendors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timezone` to the `vendors` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `countryCode` to the `venues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currencyCode` to the `venues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `venues` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "match_bookings_paidBy_idx";

-- DropIndex
DROP INDEX "match_bookings_venueId_idx";

-- DropIndex
DROP INDEX "match_bookings_matchId_idx";

-- DropIndex
DROP INDEX "match_bookings_matchId_key";

-- DropIndex
DROP INDEX "simple_bookings_status_idx";

-- DropIndex
DROP INDEX "simple_bookings_userId_idx";

-- DropIndex
DROP INDEX "simple_bookings_venueId_startTime_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "match_bookings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "simple_bookings";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "vendor_staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VENDOR_STAFF',
    "permissions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vendor_staff_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vendor_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendor_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 30,
    "maxConcurrentBookings" INTEGER NOT NULL DEFAULT 10,
    "requiresDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositPercentage" INTEGER,
    "basePrice" INTEGER,
    "taxRate" REAL,
    "taxIncluded" BOOLEAN NOT NULL DEFAULT true,
    "showBookingCalendar" BOOLEAN NOT NULL DEFAULT true,
    "showPricingPublicly" BOOLEAN NOT NULL DEFAULT true,
    "allowOnlinePayments" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "bookingReminders" BOOLEAN NOT NULL DEFAULT true,
    "newBookingAlerts" BOOLEAN NOT NULL DEFAULT true,
    "autoApproval" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vendor_settings_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT,
    "domain" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "domains_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "courts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "formatId" TEXT,
    "name" TEXT NOT NULL,
    "courtNumber" TEXT NOT NULL,
    "description" TEXT,
    "surface" TEXT,
    "pricePerHour" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "features" TEXT,
    "images" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "courts_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "courts_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "venue_operating_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "venue_operating_hours_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "maxPlayers" INTEGER,
    "notes" TEXT,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    "refundedAmount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT,
    "matchId" TEXT,
    "tournamentId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentGateway" TEXT,
    "gatewayTransactionId" TEXT,
    "gatewayResponse" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "refundedAmount" INTEGER NOT NULL DEFAULT 0,
    "refundReason" TEXT,
    "refundedAt" DATETIME,
    "userId" TEXT NOT NULL,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "match_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFICIAL',
    "actualStartTime" DATETIME,
    "actualEndTime" DATETIME,
    "submittedBy" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "notes" TEXT,
    "highlights" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "match_results_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "match_results_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "match_results_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "player_contributions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchResultId" TEXT NOT NULL,
    "matchId" TEXT,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "rating" INTEGER,
    "customStats" TEXT,
    "position" TEXT,
    "submittedBy" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "player_contributions_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "match_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_contributions_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "player_contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "player_contributions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "player_contributions_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "player_contributions_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CourtToTournament" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CourtToTournament_A_fkey" FOREIGN KEY ("A") REFERENCES "courts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CourtToTournament_B_fkey" FOREIGN KEY ("B") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_format_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "minPlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "format_types_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_format_types" ("createdAt", "description", "displayName", "id", "isActive", "maxPlayers", "minPlayers", "name", "sportId", "updatedAt") SELECT "createdAt", "description", "displayName", "id", "isActive", "maxPlayers", "minPlayers", "name", "sportId", "updatedAt" FROM "format_types";
DROP TABLE "format_types";
ALTER TABLE "new_format_types" RENAME TO "format_types";
CREATE INDEX "format_types_sportId_idx" ON "format_types"("sportId");
CREATE UNIQUE INDEX "format_types_sportId_name_key" ON "format_types"("sportId", "name");
CREATE TABLE "new_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT,
    "sportId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "awayApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "totalAmount" INTEGER NOT NULL,
    "homeAmountPaid" INTEGER NOT NULL DEFAULT 0,
    "awayAmountPaid" INTEGER NOT NULL DEFAULT 0,
    "homePaymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "awayPaymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "title" TEXT,
    "description" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "matches_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "venues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_matches" ("approvedAt", "approvedBy", "awayAmountPaid", "awayApproved", "awayPaymentStatus", "awayScore", "awayTeamId", "createdAt", "createdBy", "description", "duration", "formatId", "homeAmountPaid", "homePaymentStatus", "homeScore", "homeTeamId", "id", "scheduledDate", "sportId", "status", "title", "totalAmount", "updatedAt") SELECT "approvedAt", "approvedBy", "awayAmountPaid", "awayApproved", "awayPaymentStatus", "awayScore", "awayTeamId", "createdAt", "createdBy", "description", "duration", "formatId", "homeAmountPaid", "homePaymentStatus", "homeScore", "homeTeamId", "id", "scheduledDate", "sportId", "status", "title", "totalAmount", "updatedAt" FROM "matches";
DROP TABLE "matches";
ALTER TABLE "new_matches" RENAME TO "matches";
CREATE INDEX "matches_status_idx" ON "matches"("status");
CREATE INDEX "matches_homeTeamId_idx" ON "matches"("homeTeamId");
CREATE INDEX "matches_awayTeamId_idx" ON "matches"("awayTeamId");
CREATE INDEX "matches_courtId_scheduledDate_idx" ON "matches"("courtId", "scheduledDate");
CREATE INDEX "matches_courtId_scheduledDate_status_idx" ON "matches"("courtId", "scheduledDate", "status");
CREATE INDEX "matches_createdBy_idx" ON "matches"("createdBy");
CREATE INDEX "matches_sportId_status_scheduledDate_idx" ON "matches"("sportId", "status", "scheduledDate");
CREATE TABLE "new_player_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "preferredPosition" TEXT,
    "selfRating" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "player_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_skills_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_player_skills" ("createdAt", "id", "level", "sportId", "updatedAt", "userId", "yearsExperience") SELECT "createdAt", "id", "level", "sportId", "updatedAt", "userId", "yearsExperience" FROM "player_skills";
DROP TABLE "player_skills";
ALTER TABLE "new_player_skills" RENAME TO "player_skills";
CREATE INDEX "player_skills_sportId_level_idx" ON "player_skills"("sportId", "level");
CREATE UNIQUE INDEX "player_skills_userId_sportId_key" ON "player_skills"("userId", "sportId");
CREATE TABLE "new_sport_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "teamSize" INTEGER NOT NULL DEFAULT 11,
    "duration" INTEGER NOT NULL DEFAULT 90,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_sport_types" ("createdAt", "displayName", "icon", "id", "isActive", "name", "updatedAt") SELECT "createdAt", "displayName", "icon", "id", "isActive", "name", "updatedAt" FROM "sport_types";
DROP TABLE "sport_types";
ALTER TABLE "new_sport_types" RENAME TO "sport_types";
CREATE UNIQUE INDEX "sport_types_name_key" ON "sport_types"("name");
CREATE INDEX "sport_types_isActive_idx" ON "sport_types"("isActive");
CREATE TABLE "new_team_invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "message" TEXT,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" DATETIME NOT NULL DEFAULT (datetime('now', '+7 days')),
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "team_invites_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_invites_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "team_invites_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_team_invites" ("createdAt", "expiresAt", "id", "teamId") SELECT "createdAt", coalesce("expiresAt", (datetime('now', '+7 days'))) AS "expiresAt", "id", "teamId" FROM "team_invites";
DROP TABLE "team_invites";
ALTER TABLE "new_team_invites" RENAME TO "team_invites";
CREATE INDEX "team_invites_receiverId_status_idx" ON "team_invites"("receiverId", "status");
CREATE INDEX "team_invites_teamId_status_idx" ON "team_invites"("teamId", "status");
CREATE INDEX "team_invites_expiresAt_idx" ON "team_invites"("expiresAt");
CREATE TABLE "new_team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "jerseyNumber" INTEGER,
    "preferredPosition" TEXT,
    "canBookMatches" BOOLEAN NOT NULL DEFAULT false,
    "canApproveMatches" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_team_members" ("canApproveMatches", "canBookMatches", "id", "isActive", "jerseyNumber", "joinedAt", "preferredPosition", "role", "teamId", "userId") SELECT "canApproveMatches", "canBookMatches", "id", "isActive", "jerseyNumber", "joinedAt", "preferredPosition", "role", "teamId", "userId" FROM "team_members";
DROP TABLE "team_members";
ALTER TABLE "new_team_members" RENAME TO "team_members";
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");
CREATE INDEX "team_members_teamId_role_idx" ON "team_members"("teamId", "role");
CREATE INDEX "team_members_teamId_isActive_idx" ON "team_members"("teamId", "isActive");
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
CREATE TABLE "new_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "sportId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "city" TEXT,
    "level" TEXT,
    "maxPlayers" INTEGER NOT NULL DEFAULT 11,
    "minPlayers" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRecruiting" BOOLEAN NOT NULL DEFAULT true,
    "homeVenue" TEXT,
    "practiceDay" TEXT,
    "practiceTime" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "teams_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_teams" ("city", "createdAt", "description", "formatId", "id", "isActive", "level", "logoUrl", "maxPlayers", "name", "sportId", "updatedAt") SELECT "city", "createdAt", "description", "formatId", "id", "isActive", "level", "logoUrl", "maxPlayers", "name", "sportId", "updatedAt" FROM "teams";
DROP TABLE "teams";
ALTER TABLE "new_teams" RENAME TO "teams";
CREATE INDEX "teams_sportId_city_isActive_idx" ON "teams"("sportId", "city", "isActive");
CREATE INDEX "teams_formatId_idx" ON "teams"("formatId");
CREATE INDEX "teams_isActive_isRecruiting_idx" ON "teams"("isActive", "isRecruiting");
CREATE TABLE "new_tournament_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "playerLevel" TEXT,
    "preferredRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "assignedTeamId" TEXT,
    "teamColor" TEXT,
    "feePaid" BOOLEAN NOT NULL DEFAULT false,
    "feeAmount" INTEGER,
    "paidAt" DATETIME,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tournament_participants_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_participants_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tournament_participants" ("id", "paidAt", "registeredAt", "status", "tournamentId", "userId") SELECT "id", "paidAt", "registeredAt", "status", "tournamentId", "userId" FROM "tournament_participants";
DROP TABLE "tournament_participants";
ALTER TABLE "new_tournament_participants" RENAME TO "tournament_participants";
CREATE INDEX "tournament_participants_tournamentId_status_idx" ON "tournament_participants"("tournamentId", "status");
CREATE INDEX "tournament_participants_userId_status_idx" ON "tournament_participants"("userId", "status");
CREATE UNIQUE INDEX "tournament_participants_tournamentId_userId_key" ON "tournament_participants"("tournamentId", "userId");
CREATE TABLE "new_tournaments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sportId" TEXT NOT NULL,
    "preferredFormatId" TEXT,
    "actualFormatId" TEXT,
    "format" TEXT NOT NULL,
    "maxTeams" INTEGER NOT NULL,
    "targetPlayersPerTeam" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "registrationDeadline" DATETIME NOT NULL,
    "matchDuration" INTEGER NOT NULL DEFAULT 90,
    "venueId" TEXT,
    "entryFee" INTEGER NOT NULL DEFAULT 0,
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "rules" TEXT,
    "autoFormTeams" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "cancellationReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tournaments_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tournaments_preferredFormatId_fkey" FOREIGN KEY ("preferredFormatId") REFERENCES "format_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tournaments_actualFormatId_fkey" FOREIGN KEY ("actualFormatId") REFERENCES "format_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tournaments_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tournaments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_tournaments" ("actualFormatId", "createdAt", "createdBy", "description", "endDate", "id", "preferredFormatId", "registrationDeadline", "sportId", "startDate", "status", "updatedAt", "venueId") SELECT "actualFormatId", "createdAt", "createdBy", "description", "endDate", "id", "preferredFormatId", "registrationDeadline", "sportId", "startDate", "status", "updatedAt", "venueId" FROM "tournaments";
DROP TABLE "tournaments";
ALTER TABLE "new_tournaments" RENAME TO "tournaments";
CREATE INDEX "tournaments_status_startDate_idx" ON "tournaments"("status", "startDate");
CREATE INDEX "tournaments_sportId_status_idx" ON "tournaments"("sportId", "status");
CREATE INDEX "tournaments_createdBy_idx" ON "tournaments"("createdBy");
CREATE INDEX "tournaments_venueId_idx" ON "tournaments"("venueId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" DATETIME,
    "countryCode" TEXT,
    "currencyCode" TEXT,
    "timezone" TEXT,
    "locale" TEXT,
    "dateOfBirth" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "isActive", "lastLoginAt", "name", "password", "phone", "updatedAt") SELECT "createdAt", "email", "id", "isActive", "lastLoginAt", "name", "password", "phone", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_isActive_idx" ON "users"("role", "isActive");
CREATE TABLE "new_vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "website" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "onboardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
INSERT INTO "new_vendors" ("createdAt", "description", "email", "id", "isActive", "name", "phone", "updatedAt") SELECT "createdAt", "description", "email", "id", "isActive", "name", "phone", "updatedAt" FROM "vendors";
DROP TABLE "vendors";
ALTER TABLE "new_vendors" RENAME TO "vendors";
CREATE UNIQUE INDEX "vendors_name_key" ON "vendors"("name");
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");
CREATE UNIQUE INDEX "vendors_email_key" ON "vendors"("email");
CREATE INDEX "vendors_slug_idx" ON "vendors"("slug");
CREATE INDEX "vendors_isActive_idx" ON "vendors"("isActive");
CREATE TABLE "new_venues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "countryCode" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "timezone" TEXT,
    "featuredImage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "venues_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_venues" ("createdAt", "id", "isActive", "updatedAt", "vendorId") SELECT "createdAt", "id", "isActive", "updatedAt", "vendorId" FROM "venues";
DROP TABLE "venues";
ALTER TABLE "new_venues" RENAME TO "venues";
CREATE INDEX "venues_vendorId_isActive_idx" ON "venues"("vendorId", "isActive");
CREATE INDEX "venues_city_isActive_idx" ON "venues"("city", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "vendor_staff_userId_idx" ON "vendor_staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_staff_vendorId_userId_key" ON "vendor_staff"("vendorId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_settings_vendorId_key" ON "vendor_settings"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "domains_domain_key" ON "domains"("domain");

-- CreateIndex
CREATE INDEX "domains_domain_idx" ON "domains"("domain");

-- CreateIndex
CREATE INDEX "domains_vendorId_isPrimary_idx" ON "domains"("vendorId", "isPrimary");

-- CreateIndex
CREATE INDEX "courts_venueId_sportId_isActive_idx" ON "courts"("venueId", "sportId", "isActive");

-- CreateIndex
CREATE INDEX "courts_sportId_isActive_idx" ON "courts"("sportId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "courts_venueId_courtNumber_key" ON "courts"("venueId", "courtNumber");

-- CreateIndex
CREATE UNIQUE INDEX "venue_operating_hours_venueId_dayOfWeek_key" ON "venue_operating_hours"("venueId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "bookings_courtId_startTime_idx" ON "bookings"("courtId", "startTime");

-- CreateIndex
CREATE INDEX "bookings_courtId_startTime_status_idx" ON "bookings"("courtId", "startTime", "status");

-- CreateIndex
CREATE INDEX "bookings_userId_createdAt_idx" ON "bookings"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "bookings_status_startTime_idx" ON "bookings"("status", "startTime");

-- CreateIndex
CREATE INDEX "bookings_type_status_idx" ON "bookings"("type", "status");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_matchId_idx" ON "payments"("matchId");

-- CreateIndex
CREATE INDEX "payments_userId_status_idx" ON "payments"("userId", "status");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_gatewayTransactionId_idx" ON "payments"("gatewayTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "match_results_matchId_key" ON "match_results"("matchId");

-- CreateIndex
CREATE INDEX "match_results_matchId_idx" ON "match_results"("matchId");

-- CreateIndex
CREATE INDEX "match_results_submittedBy_idx" ON "match_results"("submittedBy");

-- CreateIndex
CREATE INDEX "match_results_status_idx" ON "match_results"("status");

-- CreateIndex
CREATE INDEX "player_contributions_matchResultId_idx" ON "player_contributions"("matchResultId");

-- CreateIndex
CREATE INDEX "player_contributions_userId_idx" ON "player_contributions"("userId");

-- CreateIndex
CREATE INDEX "player_contributions_teamId_idx" ON "player_contributions"("teamId");

-- CreateIndex
CREATE INDEX "player_contributions_sportId_idx" ON "player_contributions"("sportId");

-- CreateIndex
CREATE UNIQUE INDEX "player_contributions_matchResultId_userId_key" ON "player_contributions"("matchResultId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "_CourtToTournament_AB_unique" ON "_CourtToTournament"("A", "B");

-- CreateIndex
CREATE INDEX "_CourtToTournament_B_index" ON "_CourtToTournament"("B");
