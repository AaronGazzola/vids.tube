import { PrismaClient } from "../lib/generated/prisma/index.js";
import { promises as fs } from "fs";
import * as path from "path";
import * as os from "os";
import * as ffmpeg from "fluent-ffmpeg";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { exec } from "child_process";
import { promisify } from "util";
import { createReadStream } from "fs";

const execAsync = promisify(exec);

const CHANNEL_HANDLE = "@azanything";
const CHANNEL_URL = `https://www.youtube.com/${CHANNEL_HANDLE}/streams`;
const YT_DLP_PATH = "/opt/homebrew/bin/yt-dlp";
const COOKIES_PATH = path.join(process.cwd(), "worker/cookies/cookies.txt");

const prisma = new PrismaClient();

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function uploadToR2(bucket: string, key: string, filePath: string, contentType: string): Promise<string> {
  const fileStream = createReadStream(filePath);

  const upload = new Upload({
    client: r2Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
    },
  });

  await upload.done();

  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (publicDomain) {
    return `${publicDomain}/${key}`;
  }

  return `https://${bucket}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

async function getChannelVideoIds(): Promise<string[]> {
  console.log(JSON.stringify({ action: "fetching_channel_videos", channel: CHANNEL_HANDLE }));

  const { stdout } = await execAsync(
    `${YT_DLP_PATH} --cookies "${COOKIES_PATH}" "${CHANNEL_URL}" --flat-playlist --skip-download --dump-single-json`,
    { maxBuffer: 10 * 1024 * 1024 }
  );

  const data = JSON.parse(stdout);
  const videoIds = data.entries?.map((entry: { id: string }) => entry.id) || [];

  console.log(JSON.stringify({ action: "channel_videos_fetched", count: videoIds.length }));

  return videoIds;
}

async function getVideoMetadata(videoPath: string): Promise<{ duration?: number; resolution?: string }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === "video");
      const duration = metadata.format.duration;
      const resolution = videoStream ? `${videoStream.width}x${videoStream.height}` : undefined;

      resolve({ duration, resolution });
    });
  });
}

async function getYouTubeMetadata(youtubeId: string): Promise<{
  title?: string;
  description?: string;
  publishedAt?: Date;
  viewCount?: number;
  likeCount?: number;
  channelTitle?: string;
}> {
  try {
    const sourceUrl = `https://www.youtube.com/watch?v=${youtubeId}`;

    console.log(JSON.stringify({ action: "fetching_youtube_metadata", youtubeId }));

    const { stdout } = await execAsync(
      `${YT_DLP_PATH} --cookies "${COOKIES_PATH}" "${sourceUrl}" --dump-single-json --skip-download`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const data = JSON.parse(stdout);

    return {
      title: data.title || undefined,
      description: data.description || undefined,
      publishedAt: data.upload_date ? new Date(`${data.upload_date.slice(0, 4)}-${data.upload_date.slice(4, 6)}-${data.upload_date.slice(6, 8)}`) : undefined,
      viewCount: data.view_count || undefined,
      likeCount: data.like_count || undefined,
      channelTitle: data.channel || data.uploader || undefined,
    };
  } catch (error: unknown) {
    console.log(JSON.stringify({ action: "youtube_metadata_fetch_failed", youtubeId, error: error instanceof Error ? error.message : String(error) }));
    return {};
  }
}

async function downloadAndUploadThumbnail(youtubeId: string, tempDir: string): Promise<{ thumbnailUrl: string; thumbnailKey: string } | null> {
  try {
    const sourceUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const tempThumbnailPath = path.join(tempDir, `${youtubeId}.jpg`);

    console.log(JSON.stringify({ action: "downloading_thumbnail", youtubeId }));

    await execAsync(
      `${YT_DLP_PATH} --cookies "${COOKIES_PATH}" "${sourceUrl}" --write-thumbnail --skip-download --convert-thumbnails jpg -o "${path.join(tempDir, youtubeId)}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const stats = await fs.stat(tempThumbnailPath);
    if (!stats.isFile() || stats.size === 0) {
      console.log(JSON.stringify({ action: "thumbnail_download_failed", youtubeId, reason: "invalid_file" }));
      return null;
    }

    const bucket = process.env.R2_BUCKET;
    if (!bucket) {
      throw new Error("R2_BUCKET environment variable not set");
    }

    const thumbnailKey = `thumbnails/${youtubeId}.jpg`;

    console.log(JSON.stringify({ action: "uploading_thumbnail_to_r2", youtubeId, thumbnailKey }));

    const thumbnailUrl = await uploadToR2(bucket, thumbnailKey, tempThumbnailPath, "image/jpeg");

    console.log(JSON.stringify({ action: "thumbnail_upload_complete", youtubeId, thumbnailUrl }));

    return { thumbnailUrl, thumbnailKey };
  } catch (error: unknown) {
    console.log(JSON.stringify({ action: "thumbnail_processing_failed", youtubeId, error: error instanceof Error ? error.message : String(error) }));
    return null;
  }
}

async function downloadAndUploadVideo(youtubeId: string): Promise<void> {
  const tempDir = path.join(os.tmpdir(), `sync-${Date.now()}-${youtubeId}`);

  try {
    await fs.mkdir(tempDir, { recursive: true });

    const sourceUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const tempVideoPath = path.join(tempDir, `${youtubeId}.mp4`);

    console.log(JSON.stringify({ action: "downloading_video", youtubeId }));

    await execAsync(
      `${YT_DLP_PATH} --cookies "${COOKIES_PATH}" "${sourceUrl}" -o "${tempVideoPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    const stats = await fs.stat(tempVideoPath);
    if (!stats.isFile() || stats.size === 0) {
      throw new Error(`Downloaded video is invalid: size=${stats.size}`);
    }

    console.log(JSON.stringify({ action: "download_complete", youtubeId, fileSize: stats.size }));

    const metadata = await getVideoMetadata(tempVideoPath);

    const bucket = process.env.R2_BUCKET;
    if (!bucket) {
      throw new Error("R2_BUCKET environment variable not set");
    }

    const storageKey = `videos/${youtubeId}.mp4`;

    console.log(JSON.stringify({ action: "uploading_to_r2", youtubeId, storageKey }));

    const storageUrl = await uploadToR2(bucket, storageKey, tempVideoPath, "video/mp4");

    console.log(JSON.stringify({ action: "upload_complete", youtubeId, storageUrl }));

    const thumbnailData = await downloadAndUploadThumbnail(youtubeId, tempDir);

    const youtubeMetadata = await getYouTubeMetadata(youtubeId);

    await prisma.video.create({
      data: {
        youtubeId,
        sourceUrl,
        storageUrl,
        storageKey,
        thumbnailUrl: thumbnailData?.thumbnailUrl,
        thumbnailKey: thumbnailData?.thumbnailKey,
        fileSize: BigInt(stats.size),
        duration: metadata.duration,
        resolution: metadata.resolution,
        downloadedAt: new Date(),
        lastUsedAt: new Date(),
        title: youtubeMetadata.title,
        description: youtubeMetadata.description,
        publishedAt: youtubeMetadata.publishedAt,
        viewCount: youtubeMetadata.viewCount,
        likeCount: youtubeMetadata.likeCount,
        channelTitle: youtubeMetadata.channelTitle,
      },
    });

    console.log(JSON.stringify({ action: "database_updated", youtubeId }));

    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error: unknown) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

async function backfillMissingMetadata(): Promise<void> {
  console.log(JSON.stringify({ action: "backfill_metadata_started" }));

  const videosWithoutMetadata = await prisma.video.findMany({
    where: {
      title: null,
    },
    select: {
      youtubeId: true,
    },
  });

  console.log(JSON.stringify({
    action: "backfill_analysis",
    videosWithoutMetadata: videosWithoutMetadata.length
  }));

  if (videosWithoutMetadata.length === 0) {
    console.log(JSON.stringify({ action: "backfill_complete", message: "All videos have metadata" }));
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < videosWithoutMetadata.length; i++) {
    const { youtubeId } = videosWithoutMetadata[i];

    console.log(JSON.stringify({
      action: "backfilling_metadata",
      current: i + 1,
      total: videosWithoutMetadata.length,
      youtubeId
    }));

    try {
      const youtubeMetadata = await getYouTubeMetadata(youtubeId);

      await prisma.video.update({
        where: { youtubeId },
        data: {
          title: youtubeMetadata.title,
          description: youtubeMetadata.description,
          publishedAt: youtubeMetadata.publishedAt,
          viewCount: youtubeMetadata.viewCount,
          likeCount: youtubeMetadata.likeCount,
          channelTitle: youtubeMetadata.channelTitle,
        },
      });

      console.log(JSON.stringify({ action: "metadata_backfilled", youtubeId }));
      successCount++;
    } catch (error: unknown) {
      console.log(JSON.stringify({
        action: "metadata_backfill_error",
        youtubeId,
        error: error instanceof Error ? error.message : String(error)
      }));
      failCount++;
    }
  }

  console.log(JSON.stringify({
    action: "backfill_complete",
    total: videosWithoutMetadata.length,
    success: successCount,
    failed: failCount
  }));
}

async function backfillMissingThumbnails(): Promise<void> {
  console.log(JSON.stringify({ action: "backfill_thumbnails_started" }));

  const videosWithoutThumbnails = await prisma.video.findMany({
    where: {
      thumbnailUrl: null,
    },
    select: {
      youtubeId: true,
    },
  });

  console.log(JSON.stringify({
    action: "backfill_analysis",
    videosWithoutThumbnails: videosWithoutThumbnails.length
  }));

  if (videosWithoutThumbnails.length === 0) {
    console.log(JSON.stringify({ action: "backfill_complete", message: "All videos have thumbnails" }));
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < videosWithoutThumbnails.length; i++) {
    const { youtubeId } = videosWithoutThumbnails[i];
    const tempDir = path.join(os.tmpdir(), `thumbnail-backfill-${Date.now()}-${youtubeId}`);

    console.log(JSON.stringify({
      action: "backfilling_thumbnail",
      current: i + 1,
      total: videosWithoutThumbnails.length,
      youtubeId
    }));

    try {
      await fs.mkdir(tempDir, { recursive: true });

      const thumbnailData = await downloadAndUploadThumbnail(youtubeId, tempDir);

      if (thumbnailData) {
        await prisma.video.update({
          where: { youtubeId },
          data: {
            thumbnailUrl: thumbnailData.thumbnailUrl,
            thumbnailKey: thumbnailData.thumbnailKey,
          },
        });

        console.log(JSON.stringify({ action: "thumbnail_backfilled", youtubeId }));
        successCount++;
      } else {
        failCount++;
      }

      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error: unknown) {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(JSON.stringify({
        action: "thumbnail_backfill_error",
        youtubeId,
        error: error instanceof Error ? error.message : String(error)
      }));
      failCount++;
    }
  }

  console.log(JSON.stringify({
    action: "backfill_complete",
    total: videosWithoutThumbnails.length,
    success: successCount,
    failed: failCount
  }));
}

async function main() {
  try {
    console.log(JSON.stringify({ action: "sync_started", channel: CHANNEL_HANDLE }));

    await backfillMissingMetadata();

    await backfillMissingThumbnails();

    const channelVideoIds = await getChannelVideoIds();

    const existingVideos = await prisma.video.findMany({
      where: {
        youtubeId: {
          in: channelVideoIds,
        },
      },
      select: {
        youtubeId: true,
      },
    });

    const existingVideoIds = new Set(existingVideos.map((v: { youtubeId: string }) => v.youtubeId));
    const missingVideoIds = channelVideoIds.filter(id => !existingVideoIds.has(id));

    console.log(JSON.stringify({
      action: "sync_analysis",
      total: channelVideoIds.length,
      existing: existingVideoIds.size,
      missing: missingVideoIds.length
    }));

    if (missingVideoIds.length === 0) {
      console.log(JSON.stringify({ action: "sync_complete", message: "All videos already synced" }));
      return;
    }

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < missingVideoIds.length; i++) {
      const youtubeId = missingVideoIds[i];
      console.log(JSON.stringify({
        action: "processing_video",
        current: i + 1,
        total: missingVideoIds.length,
        youtubeId
      }));

      try {
        await downloadAndUploadVideo(youtubeId);
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isUpcoming = errorMessage.includes("This live event will begin");

        if (isUpcoming) {
          console.log(JSON.stringify({
            action: "video_skipped",
            youtubeId,
            reason: "upcoming"
          }));
          skipCount++;
        } else {
          throw error;
        }
      }
    }

    console.log(JSON.stringify({
      action: "sync_complete",
      total: missingVideoIds.length,
      downloaded: successCount,
      skipped: skipCount
    }));
  } catch (error) {
    console.log(JSON.stringify({
      action: "sync_failed",
      error: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
