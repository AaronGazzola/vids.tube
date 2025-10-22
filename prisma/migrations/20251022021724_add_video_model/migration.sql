-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('DOWNLOADING', 'READY', 'FAILED', 'DELETED');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'DOWNLOADING',
    "storageUrl" TEXT,
    "storageKey" TEXT,
    "duration" DOUBLE PRECISION,
    "fileSize" BIGINT,
    "resolution" TEXT,
    "downloadedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectToVideo" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectToVideo_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_youtubeId_key" ON "Video"("youtubeId");

-- CreateIndex
CREATE INDEX "_ProjectToVideo_B_index" ON "_ProjectToVideo"("B");

-- AddForeignKey
ALTER TABLE "_ProjectToVideo" ADD CONSTRAINT "_ProjectToVideo_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectToVideo" ADD CONSTRAINT "_ProjectToVideo_B_fkey" FOREIGN KEY ("B") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
