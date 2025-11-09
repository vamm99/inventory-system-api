/*
  Warnings:

  - You are about to drop the `providerProduct` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `providerId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "providerProduct" DROP CONSTRAINT "providerProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "providerProduct" DROP CONSTRAINT "providerProduct_providerId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "providerId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "providerProduct";

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
