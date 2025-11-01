"use server";

import { ActionResponse, getActionResponse } from "@/lib/action.utils";
import { getAuthenticatedClient } from "@/lib/auth.utils";
import { ProcessingJob } from "@/lib/generated/prisma";
import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { StartProcessingInput } from "./page.types";

export const startProcessingAction = async (
  input: StartProcessingInput
): Promise<ActionResponse<ProcessingJob>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const video = await db.video.findUnique({
      where: { id: input.videoId },
    });

    if (!video) {
      throw new Error("Video not found");
    }

    if (!input.sections || input.sections.length === 0) {
      throw new Error("At least one section required");
    }

    if (input.sections.length > 10) {
      throw new Error("Maximum 10 sections allowed");
    }

    for (const section of input.sections) {
      if (!section.clips || section.clips.length === 0) {
        throw new Error("Each section must have at least one clip");
      }
      if (section.clips.length > 5) {
        throw new Error("Maximum 5 clips per section");
      }
    }

    const job = await db.processingJob.create({
      data: {
        userId: session.user.id,
        videoId: input.videoId,
        status: "PENDING",
        progress: 0,
      },
    });

    const workerUrl = process.env.WORKER_URL || process.env.NEXT_PUBLIC_WORKER_URL;
    if (!workerUrl) {
      throw new Error("Worker URL not configured");
    }

    const response = await fetch(`${workerUrl}/api/worker/process-shorts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobId: job.id,
        videoId: input.videoId,
        sections: input.sections,
      }),
    });

    if (!response.ok) {
      await db.processingJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          error: "Failed to start processing",
        },
      });
      throw new Error("Failed to start processing");
    }

    conditionalLog({ jobId: job.id }, { label: LOG_LABELS.API });

    return getActionResponse({ data: job });
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.API });
    return getActionResponse({ error });
  }
};

export const getProcessingStatusAction = async (
  jobId: string
): Promise<ActionResponse<ProcessingJob>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const job = await db.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (job.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    conditionalLog({ jobStatus: job.status, progress: job.progress }, { label: LOG_LABELS.API });

    return getActionResponse({ data: job });
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.API });
    return getActionResponse({ error });
  }
};

export const cancelProcessingAction = async (
  jobId: string
): Promise<ActionResponse<void>> => {
  try {
    const { db, session } = await getAuthenticatedClient();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const job = await db.processingJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (job.userId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    await db.processingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: "Cancelled by user",
      },
    });

    const workerUrl = process.env.WORKER_URL || process.env.NEXT_PUBLIC_WORKER_URL;
    if (workerUrl) {
      await fetch(`${workerUrl}/api/worker/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
    }

    conditionalLog({ cancelledJobId: jobId }, { label: LOG_LABELS.API });

    return getActionResponse();
  } catch (error) {
    conditionalLog({ error }, { label: LOG_LABELS.API });
    return getActionResponse({ error });
  }
};
