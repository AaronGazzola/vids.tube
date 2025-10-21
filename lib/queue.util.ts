import { Queue } from "bullmq";
import { VideoProcessingJobData, VideoProcessingJobResult } from "./queue.types";
import { getRedisConnection } from "./redis.config";

export const videoProcessingQueue = new Queue<VideoProcessingJobData, VideoProcessingJobResult>(
  "video-processing",
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
