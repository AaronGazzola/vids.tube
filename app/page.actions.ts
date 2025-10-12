"use server";

import { ActionResponse, getActionResponse } from "@/lib/action.utils";
import { prisma } from "@/lib/prisma";
import { Project, ProcessingJob, JobStatus } from "@/lib/generated/prisma";
import { CreateProjectData, ProcessVideoData } from "./page.types";

export const createProjectAction = async (
  data: CreateProjectData
): Promise<ActionResponse<Project>> => {
  try {
    const project = await prisma.project.create({
      data: {
        userId: "temp-user",
        videoId: data.videoId,
        videoUrl: data.videoUrl,
        clips: JSON.stringify(data.clips),
      },
    });

    return getActionResponse({ data: project });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const processVideoAction = async (
  data: ProcessVideoData
): Promise<ActionResponse<ProcessingJob>> => {
  try {
    const response = await fetch(`/api/projects/${data.projectId}/process`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process video');
    }

    const job = await response.json();
    return getActionResponse({ data: job });
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

export const getProjectAction = async (
  projectId: string
): Promise<ActionResponse<Project | null>> => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        jobs: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return getActionResponse({ data: project });
  } catch (error) {
    return getActionResponse({ error });
  }
};
