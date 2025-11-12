-- CreateTable
CREATE TABLE "barcode" (
    "id" SERIAL NOT NULL,
    "barcode" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "barcode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barcode_id_key" ON "barcode"("id");

-- CreateIndex
CREATE UNIQUE INDEX "barcode_barcode_key" ON "barcode"("barcode");
