-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "channelTitle" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "likeCount" INTEGER,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT,
ADD COLUMN     "viewCount" INTEGER;
