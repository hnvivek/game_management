-- AlterTable
ALTER TABLE "courts" DROP COLUMN "length";
ALTER TABLE "courts" DROP COLUMN "width";

-- AlterTable
ALTER TABLE "format_types" ADD COLUMN "length" REAL;
ALTER TABLE "format_types" ADD COLUMN "width" REAL;
