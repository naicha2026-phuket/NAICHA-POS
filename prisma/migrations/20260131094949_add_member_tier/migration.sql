-- CreateEnum
CREATE TYPE "EMemberTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "tier" "EMemberTier" DEFAULT 'BRONZE';
