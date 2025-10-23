const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function cleanupDuplicateHttps() {
  try {
    const videos = await prisma.video.findMany({
      where: {
        storageUrl: {
          contains: 'https://https://'
        }
      }
    });

    console.log(JSON.stringify({ message: 'Found videos with duplicate https prefix', count: videos.length }, null, 0));

    if (videos.length === 0) {
      console.log(JSON.stringify({ message: 'No videos to cleanup' }, null, 0));
      return;
    }

    for (const video of videos) {
      const originalUrl = video.storageUrl;
      const cleanedUrl = originalUrl.replace('https://https://', 'https://');

      await prisma.video.update({
        where: { id: video.id },
        data: { storageUrl: cleanedUrl }
      });

      console.log(JSON.stringify({
        videoId: video.id,
        youtubeId: video.youtubeId,
        original: originalUrl,
        cleaned: cleanedUrl
      }, null, 0));
    }

    console.log(JSON.stringify({ message: 'Cleanup completed', updated: videos.length }, null, 0));
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateHttps();
