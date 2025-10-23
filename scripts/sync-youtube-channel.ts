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
    return `https://${publicDomain}/${key}`;
  }

  return `https://${bucket}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
}

async function getChannelVideoIds(): Promise<string[]> {
  console.log(JSON.stringify({ action: "fetching_channel_videos", channel: CHANNEL_HANDLE }));

  const { stdout } = await execAsync(
    `${YT_DLP_PATH} --cookies "${COOKIES_PATH}" "${CHANNEL_URL}" --flat-playlist --skip-download --dump-single-json`
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

async function downloadAndUploadVideo(youtubeId: string): Promise<void> {
  const tempDir = path.join(os.tmpdir(), `sync-${Date.now()}-${youtubeId}`);

  try {
    await fs.mkdir(tempDir, { recursive: true });

    const sourceUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    const tempVideoPath = path.join(tempDir, `${youtubeId}.mp4`);

    console.log(JSON.stringify({ action: "downloading_video", youtubeId }));

    await execAsync(
      `${YT_DLP_PATH} --cookies "${COOKIES_PATH}" "${sourceUrl}" -o "${tempVideoPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4`
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

    await prisma.video.create({
      data: {
        youtubeId,
        sourceUrl,
        status: "READY",
        storageUrl,
        storageKey,
        fileSize: BigInt(stats.size),
        duration: metadata.duration,
        resolution: metadata.resolution,
        downloadedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    console.log(JSON.stringify({ action: "database_updated", youtubeId }));

    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error: unknown) {
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  try {
    console.log(JSON.stringify({ action: "sync_started", channel: CHANNEL_HANDLE }));

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
