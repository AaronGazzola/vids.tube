import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import { getRedisConnection } from "./redis.config.js";
import { downloadWithRetry } from "./ytdlp.util.js";
import { uploadToR2 } from "./r2.config.js";
import type { VideoDownloadJobData, VideoDownloadJobResult } from "./types.js";

const prisma = new PrismaClient();

async function getVideoMetadata(videoPath: string): Promise<{ duration?: number; resolution?: string }> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        console.log(JSON.stringify({
          action: "ffprobe_error",
          error: err.message
        }));
        resolve({});
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === "video");
      const duration = metadata.format.duration;
      const resolution = videoStream ? `${videoStream.width}x${videoStream.height}` : undefined;

      resolve({ duration, resolution });
    });
  });
}

async function downloadVideo(data: VideoDownloadJobData): Promise<VideoDownloadJobResult> {
  const { videoId, youtubeId, sourceUrl } = data;
  const tempDir = path.join(os.tmpdir(), `video-download-${Date.now()}`);

  try {
    await fs.mkdir(tempDir, { recursive: true });

    console.log(JSON.stringify({
      action: "download_started",
      videoId,
      youtubeId
    }));

    const tempVideoPath = path.join(tempDir, `${youtubeId}.mp4`);

    const ytDlpOptions: Record<string, unknown> = {
      output: tempVideoPath,
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      mergeOutputFormat: "mp4",
    };

    await downloadWithRetry(sourceUrl, ytDlpOptions, 3);

    const stats = await fs.stat(tempVideoPath);
    if (!stats.isFile() || stats.size === 0) {
      throw new Error(`Downloaded video is invalid: size=${stats.size}`);
    }

    console.log(JSON.stringify({
      action: "download_complete",
      videoId,
      fileSize: stats.size
    }));

    const metadata = await getVideoMetadata(tempVideoPath);

    const bucket = process.env.R2_BUCKET;
    if (!bucket) {
      throw new Error("R2_BUCKET environment variable not set");
    }

    const storageKey = `videos/${youtubeId}.mp4`;
    const videoBuffer = await fs.readFile(tempVideoPath);

    console.log(JSON.stringify({
      action: "uploading_to_r2",
      videoId,
      storageKey
    }));

    const storageUrl = await uploadToR2(bucket, storageKey, videoBuffer, "video/mp4");

    console.log(JSON.stringify({
      action: "upload_complete",
      videoId,
      storageUrl
    }));

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "READY",
        storageUrl,
        storageKey,
        fileSize: BigInt(stats.size),
        duration: metadata.duration,
        resolution: metadata.resolution,
        downloadedAt: new Date(),
      },
    });

    await fs.rm(tempDir, { recursive: true, force: true });

    return {
      success: true,
      storageUrl,
      storageKey,
      fileSize: stats.size,
      duration: metadata.duration,
      resolution: metadata.resolution,
    };
  } catch (error: unknown) {
    console.log(JSON.stringify({
      action: "download_failed",
      videoId,
      error
    }));

    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "FAILED",
        error: errorMessage,
      },
    });

    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    await prisma.$disconnect();
  }
}

export function startVideoDownloadWorker() {
  const worker = new Worker<VideoDownloadJobData, VideoDownloadJobResult>(
    "video-download",
    async (job: Job<VideoDownloadJobData>) => {
      console.log(JSON.stringify({
        action: "video_download_job_started",
        videoId: job.data.videoId,
        youtubeId: job.data.youtubeId
      }));

      try {
        const result = await downloadVideo(job.data);
        console.log(JSON.stringify({
          action: "video_download_job_completed",
          videoId: job.data.videoId,
          success: result.success
        }));
        return result;
      } catch (error) {
        console.log(JSON.stringify({
          action: "video_download_job_failed",
          videoId: job.data.videoId,
          error: error instanceof Error ? error.message : "Unknown error"
        }));
        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
      limiter: {
        max: 2,
        duration: 60000,
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(JSON.stringify({
      action: "video_download_worker_completed",
      jobId: job.id
    }));
  });

  worker.on("failed", (job, err) => {
    console.log(JSON.stringify({
      action: "video_download_worker_failed",
      jobId: job?.id,
      error: err.message
    }));
  });

  worker.on("error", (err) => {
    console.log(JSON.stringify({
      action: "video_download_worker_error",
      error: err.message
    }));
  });

  console.log(JSON.stringify({
    action: "video_download_worker_ready",
    queue: "video-download"
  }));

  return worker;
}
