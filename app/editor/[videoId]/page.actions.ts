"use server";

import { ActionResponse, getActionResponse } from "@/lib/action.utils";
import { prisma } from "@/lib/prisma";
import { Video, ProcessingJob } from "@/lib/generated/prisma";

export const getVideoAction = async (
  youtubeId: string
): Promise<ActionResponse<Video | null>> => {
  try {
    const video = await prisma.video.findUnique({
      where: { youtubeId },
    });

    if (!video) {
      throw new Error("Video not found");
    }

    if (!video.storageUrl) {
      throw new Error("Video not synced to R2 storage");
    }

    return getActionResponse({ data: video });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const getProcessingJobAction = async (
  jobId: string
): Promise<ActionResponse<ProcessingJob | null>> => {
  try {
    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
    });

    return getActionResponse({ data: job });
  } catch (error) {
    return getActionResponse({ error });
  }
};
