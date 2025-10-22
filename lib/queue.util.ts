import { Queue } from "bullmq";
import { VideoProcessingJobData, VideoProcessingJobResult, VideoDownloadJobData, VideoDownloadJobResult } from "./queue.types";
import { getRedisConnection } from "./redis.config";

export const videoProcessingQueue = new Queue<VideoProcessingJobData, VideoProcessingJobResult>(
  "video-processing",
  {
    connection: getRedisConnection(),
  }
);

export const videoDownloadQueue = new Queue<VideoDownloadJobData, VideoDownloadJobResult>(
  "video-download",
  {
    connection: getRedisConnection(),
  }
);

export async function enqueueVideoProcessingJob(data: VideoProcessingJobData) {
  const job = await videoProcessingQueue.add("process-video", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400,
      count: 100,
    },
    removeOnFail: {
      age: 604800,
    },
  });

  return job;
}

export async function enqueueVideoDownloadJob(data: VideoDownloadJobData) {
  const job = await videoDownloadQueue.add("download-video", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: {
      age: 86400,
      count: 100,
    },
    removeOnFail: {
      age: 604800,
    },
  });

  return job;
}
