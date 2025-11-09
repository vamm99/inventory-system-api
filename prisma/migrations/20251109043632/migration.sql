/*
  Warnings:

  - A unique constraint covering the columns `[barcode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `barcode` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('KILOGRAMO', 'GRAMO', 'LITRO', 'ML');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "barcode" TEXT NOT NULL,
ADD COLUMN     "unit" "Unit" NOT NULL,
ALTER COLUMN "stock" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");
