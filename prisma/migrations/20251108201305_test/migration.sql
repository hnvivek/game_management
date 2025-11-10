-- CreateIndex
CREATE INDEX "courts_venueId_isActive_idx" ON "courts"("venueId", "isActive");

-- CreateIndex
CREATE INDEX "courts_sportId_isActive_idx" ON "courts"("sportId", "isActive");

-- CreateIndex
CREATE INDEX "courts_venueId_sportId_isActive_idx" ON "courts"("venueId", "sportId", "isActive");

-- CreateIndex
CREATE INDEX "users_email_deletedAt_isActive_idx" ON "users"("email", "deletedAt", "isActive");

-- CreateIndex
CREATE INDEX "venues_vendorId_isActive_deletedAt_idx" ON "venues"("vendorId", "isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "venues_city_countryCode_idx" ON "venues"("city", "countryCode");
