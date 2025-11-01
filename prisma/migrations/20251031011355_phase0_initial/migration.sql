-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "profileImage" TEXT,
    "bio" TEXT,
    "city" TEXT,
    "area" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "player_skills" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "yearsExperience" INTEGER,
    "preferredRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "player_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_skills_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "sportId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "city" TEXT,
    "area" TEXT,
    "level" TEXT,
    "maxPlayers" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "teams_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "jerseyNumber" INTEGER,
    "preferredPosition" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canBookMatches" BOOLEAN NOT NULL DEFAULT false,
    "canApproveMatches" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_invites" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "team_invite_code" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "inviteType" TEXT NOT NULL DEFAULT 'PLAYER',
    "defaultRole" TEXT NOT NULL DEFAULT 'MEMBER',
    "maxUses" INTEGER,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoApprove" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_invites_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "team_invites_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sport_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "format_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "format_types_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "courtNumber" TEXT NOT NULL,
    "pricePerHour" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "venues_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "venues_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "venues_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vendor_slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "simple_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "title" TEXT,
    "maxPlayers" INTEGER,
    "totalAmount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "simple_bookings_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "simple_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "simple_bookings_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT,
    "sportId" TEXT NOT NULL,
    "formatId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "matches_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "matches_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "match_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "paidBy" TEXT NOT NULL,
    "amountPaid" INTEGER NOT NULL,
    "paymentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "match_bookings_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "match_bookings_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "match_bookings_paidBy_fkey" FOREIGN KEY ("paidBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "preferredFormatId" TEXT,
    "createdBy" TEXT NOT NULL,
    "targetTeams" INTEGER NOT NULL DEFAULT 2,
    "adaptiveMode" BOOLEAN NOT NULL DEFAULT true,
    "actualFormatId" TEXT,
    "maxPlayers" INTEGER NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pricePerPlayer" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "registrationDeadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "finalTeamSize" INTEGER,
    "tournamentType" TEXT NOT NULL DEFAULT 'ROUND_ROBIN',
    "skillLevel" TEXT,
    "tournament_code" TEXT NOT NULL,
    "allowPublicJoin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tournaments_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tournaments_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tournaments_preferredFormatId_fkey" FOREIGN KEY ("preferredFormatId") REFERENCES "format_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tournaments_actualFormatId_fkey" FOREIGN KEY ("actualFormatId") REFERENCES "format_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tournaments_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tournament_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "assignedTeam" TEXT,
    "jerseyNumber" INTEGER,
    CONSTRAINT "tournament_participants_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tournament_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "player_skills_sportId_level_idx" ON "player_skills"("sportId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "player_skills_userId_sportId_key" ON "player_skills"("userId", "sportId");

-- CreateIndex
CREATE INDEX "teams_sportId_city_isActive_idx" ON "teams"("sportId", "city", "isActive");

-- CreateIndex
CREATE INDEX "teams_formatId_idx" ON "teams"("formatId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE INDEX "team_members_teamId_role_idx" ON "team_members"("teamId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_invites_team_invite_code_key" ON "team_invites"("team_invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "sport_types_name_key" ON "sport_types"("name");

-- CreateIndex
CREATE INDEX "format_types_sportId_isActive_idx" ON "format_types"("sportId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "format_types_sportId_name_key" ON "format_types"("sportId", "name");

-- CreateIndex
CREATE INDEX "venues_vendorId_sportId_idx" ON "venues"("vendorId", "sportId");

-- CreateIndex
CREATE INDEX "venues_sportId_isActive_idx" ON "venues"("sportId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_vendor_slug_key" ON "vendors"("vendor_slug");

-- CreateIndex
CREATE INDEX "simple_bookings_venueId_startTime_idx" ON "simple_bookings"("venueId", "startTime");

-- CreateIndex
CREATE INDEX "simple_bookings_userId_idx" ON "simple_bookings"("userId");

-- CreateIndex
CREATE INDEX "simple_bookings_status_idx" ON "simple_bookings"("status");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "matches_homeTeamId_idx" ON "matches"("homeTeamId");

-- CreateIndex
CREATE INDEX "matches_venueId_scheduledDate_idx" ON "matches"("venueId", "scheduledDate");

-- CreateIndex
CREATE INDEX "matches_createdBy_idx" ON "matches"("createdBy");

-- CreateIndex
CREATE INDEX "matches_homePaymentStatus_awayPaymentStatus_idx" ON "matches"("homePaymentStatus", "awayPaymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "match_bookings_matchId_key" ON "match_bookings"("matchId");

-- CreateIndex
CREATE INDEX "match_bookings_matchId_idx" ON "match_bookings"("matchId");

-- CreateIndex
CREATE INDEX "match_bookings_venueId_idx" ON "match_bookings"("venueId");

-- CreateIndex
CREATE INDEX "match_bookings_paidBy_idx" ON "match_bookings"("paidBy");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_tournament_code_key" ON "tournaments"("tournament_code");

-- CreateIndex
CREATE INDEX "tournament_participants_tournamentId_status_idx" ON "tournament_participants"("tournamentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_participants_tournamentId_userId_key" ON "tournament_participants"("tournamentId", "userId");
