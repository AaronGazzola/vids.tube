import { Queue } from "bullmq";
import { VideoProcessingJobData, VideoProcessingJobResult } from "./queue.types";

const redisConnection = process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

export const videoProcessingQueue = new Queue<VideoProcessingJobData, VideoProcessingJobResult>(
  "video-processing",
  {
    connection: redisConnection,
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
