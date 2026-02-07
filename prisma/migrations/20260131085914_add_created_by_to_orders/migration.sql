-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "createdBy" UUID;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
