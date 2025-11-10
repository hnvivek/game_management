-- AlterTable: Rename minPlayers to playersPerTeam
ALTER TABLE "format_types" RENAME COLUMN "minPlayers" TO "playersPerTeam";

-- AlterTable: Rename maxPlayers to maxTotalPlayers and make it nullable
-- First, add the new column
ALTER TABLE "format_types" ADD COLUMN "maxTotalPlayers" INTEGER;

-- Copy data from maxPlayers to maxTotalPlayers
UPDATE "format_types" SET "maxTotalPlayers" = "maxPlayers";

-- Drop the old maxPlayers column
ALTER TABLE "format_types" DROP COLUMN "maxPlayers";

