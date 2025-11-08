-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "avatarUrl" TEXT,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "vendors" (
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
    "basePrice" DECIMAL NOT NULL DEFAULT 1000,
    "taxRate" DECIMAL NOT NULL DEFAULT 18.0,
    "taxIncluded" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "venues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "latitude" DECIMAL,
    "longitude" DECIMAL,
    "phone" TEXT,
    "email" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "venues_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "venue_operating_hours" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "venueId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openingTime" TEXT NOT NULL,
    "closingTime" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "venue_operating_hours_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "pricePerHour" DECIMAL NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxPlayers" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "courts_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "courts_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sport_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "teamSize" INTEGER,
    "duration" INTEGER,
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
    "description" TEXT,
    "minPlayers" INTEGER NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "format_types_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookings" (
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
    CONSTRAINT "bookings_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "courts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "venues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sportId" TEXT NOT NULL,
    "formatId" TEXT,
    "city" TEXT,
    "maxPlayers" INTEGER NOT NULL,
    "minPlayers" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isRecruiting" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "teams_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teams_formatId_fkey" FOREIGN KEY ("formatId") REFERENCES "format_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_name_key" ON "vendors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_email_key" ON "vendors"("email");

-- CreateIndex
CREATE INDEX "vendors_slug_idx" ON "vendors"("slug");

-- CreateIndex
CREATE INDEX "vendors_isActive_idx" ON "vendors"("isActive");

-- CreateIndex
CREATE INDEX "vendor_staff_vendorId_idx" ON "vendor_staff"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_staff_userId_idx" ON "vendor_staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_staff_vendorId_userId_key" ON "vendor_staff"("vendorId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_settings_vendorId_key" ON "vendor_settings"("vendorId");

-- CreateIndex
CREATE INDEX "venues_vendorId_idx" ON "venues"("vendorId");

-- CreateIndex
CREATE INDEX "venues_isActive_idx" ON "venues"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "venue_operating_hours_venueId_dayOfWeek_key" ON "venue_operating_hours"("venueId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "courts_venueId_idx" ON "courts"("venueId");

-- CreateIndex
CREATE INDEX "courts_sportId_idx" ON "courts"("sportId");

-- CreateIndex
CREATE INDEX "courts_isActive_idx" ON "courts"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "courts_venueId_courtNumber_key" ON "courts"("venueId", "courtNumber");

-- CreateIndex
CREATE UNIQUE INDEX "sport_types_name_key" ON "sport_types"("name");

-- CreateIndex
CREATE INDEX "sport_types_isActive_idx" ON "sport_types"("isActive");

-- CreateIndex
CREATE INDEX "format_types_sportId_idx" ON "format_types"("sportId");

-- CreateIndex
CREATE UNIQUE INDEX "format_types_sportId_name_key" ON "format_types"("sportId", "name");

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_courtId_idx" ON "bookings"("courtId");

-- CreateIndex
CREATE INDEX "bookings_date_idx" ON "bookings"("date");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "teams_sportId_idx" ON "teams"("sportId");

-- CreateIndex
CREATE INDEX "teams_city_idx" ON "teams"("city");

-- CreateIndex
CREATE INDEX "teams_isActive_idx" ON "teams"("isActive");

-- CreateIndex
CREATE INDEX "teams_isRecruiting_idx" ON "teams"("isRecruiting");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
