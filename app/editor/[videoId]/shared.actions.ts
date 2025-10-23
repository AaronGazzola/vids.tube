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
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const clips = JSON.parse(project.clips as string);

    const job = await prisma.processingJob.create({
      data: {
        projectId: data.projectId,
        status: "PENDING",
        totalSteps: 4,
        totalClips: clips.length,
      },
    });

    try {
      const { enqueueVideoProcessingJob } = await import("@/lib/queue.util");
      await enqueueVideoProcessingJob({
        jobId: job.id,
        projectId: project.id,
        videoId: project.videoId,
        clips,
      });
    } catch (bgError) {
      await prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          currentStep: "Failed to enqueue job",
          error: bgError instanceof Error ? bgError.message : "Unknown error enqueuing job",
        },
      });
      throw new Error("Failed to start video processing");
    }

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
