import { Worker, Job } from "bullmq";
import { processVideo } from "./processor.js";
import type { VideoProcessingJobData, VideoProcessingJobResult } from "./types.js";

const redisConnection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
    };

export function startWorker() {
  const worker = new Worker<VideoProcessingJobData, VideoProcessingJobResult>(
    "video-processing",
    async (job: Job<VideoProcessingJobData>) => {
      console.log(JSON.stringify({
        action: "job_started",
        jobId: job.data.jobId,
        projectId: job.data.projectId
      }));

      try {
        const result = await processVideo(job.data);
        console.log(JSON.stringify({
          action: "job_completed",
          jobId: job.data.jobId,
          success: result.success
        }));
        return result;
      } catch (error) {
        console.log(JSON.stringify({
          action: "job_failed",
          jobId: job.data.jobId,
          error: error instanceof Error ? error.message : "Unknown error"
        }));
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 60000,
      },
    }
  );

  worker.on("completed", (job) => {
    console.log(JSON.stringify({ action: "worker_job_completed", jobId: job.id }));
  });

  worker.on("failed", (job, err) => {
    console.log(JSON.stringify({
      action: "worker_job_failed",
      jobId: job?.id,
      error: err.message
    }));
  });

  worker.on("error", (err) => {
    console.log(JSON.stringify({ action: "worker_error", error: err.message }));
  });

  console.log(JSON.stringify({ action: "worker_ready", queue: "video-processing" }));

  return worker;
}
