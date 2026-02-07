/*
  Warnings:

  - The values [NO,LESS] on the enum `ESWeetNessLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ESWeetNessLevel_new" AS ENUM ('ZERO', 'TWENTY_FIVE', 'FIFTY', 'SEVENTY_FIVE', 'NORMAL', 'EXTRA');
ALTER TABLE "public"."OrderItem" ALTER COLUMN "sweetness" DROP DEFAULT;
ALTER TABLE "OrderItem" ALTER COLUMN "sweetness" TYPE "ESWeetNessLevel_new" USING ("sweetness"::text::"ESWeetNessLevel_new");
ALTER TYPE "ESWeetNessLevel" RENAME TO "ESWeetNessLevel_old";
ALTER TYPE "ESWeetNessLevel_new" RENAME TO "ESWeetNessLevel";
DROP TYPE "public"."ESWeetNessLevel_old";
ALTER TABLE "OrderItem" ALTER COLUMN "sweetness" SET DEFAULT 'NORMAL';
COMMIT;
