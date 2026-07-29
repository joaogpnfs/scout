-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "fieldSchema" JSONB NOT NULL,
    "destinationType" TEXT NOT NULL,
    "destinationConfig" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Capture" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "ocrText" TEXT NOT NULL,
    "extracted" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Capture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Correction" (
    "id" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "aiValue" TEXT NOT NULL,
    "userValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Correction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Capture_collectionId_idx" ON "Capture"("collectionId");

-- CreateIndex
CREATE INDEX "Correction_captureId_idx" ON "Correction"("captureId");

-- AddForeignKey
ALTER TABLE "Capture" ADD CONSTRAINT "Capture_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "Capture"("id") ON DELETE CASCADE ON UPDATE CASCADE;
