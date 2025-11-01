-- AlterTable
ALTER TABLE "ProcessingJob" ADD COLUMN     "userId" TEXT,
ADD COLUMN     "videoId" TEXT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "startTime" DOUBLE PRECISION NOT NULL,
    "endTime" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "cropX" DOUBLE PRECISION NOT NULL,
    "cropY" DOUBLE PRECISION NOT NULL,
    "cropWidth" DOUBLE PRECISION NOT NULL,
    "cropHeight" DOUBLE PRECISION NOT NULL,
    "previewX" DOUBLE PRECISION NOT NULL,
    "previewY" DOUBLE PRECISION NOT NULL,
    "previewScale" DOUBLE PRECISION NOT NULL,
    "zIndex" INTEGER NOT NULL DEFAULT 0,
    "thumbnailUrl" TEXT,
    "thumbnailKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Section_userId_idx" ON "Section"("userId");

-- CreateIndex
CREATE INDEX "Section_videoId_idx" ON "Section"("videoId");

-- CreateIndex
CREATE INDEX "Section_videoId_order_idx" ON "Section"("videoId", "order");

-- CreateIndex
CREATE INDEX "Clip_userId_idx" ON "Clip"("userId");

-- CreateIndex
CREATE INDEX "Clip_sectionId_idx" ON "Clip"("sectionId");

-- CreateIndex
CREATE INDEX "Clip_sectionId_zIndex_idx" ON "Clip"("sectionId", "zIndex");

-- CreateIndex
CREATE INDEX "ProcessingJob_userId_idx" ON "ProcessingJob"("userId");

-- CreateIndex
CREATE INDEX "ProcessingJob_videoId_idx" ON "ProcessingJob"("videoId");

-- AddForeignKey
ALTER TABLE "ProcessingJob" ADD CONSTRAINT "ProcessingJob_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clip" ADD CONSTRAINT "Clip_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;
