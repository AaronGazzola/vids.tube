"use client";

import {
  createProjectAction,
  processVideoAction,
} from "@/app/editor/[videoId]/shared.actions";
import { toast } from "@/components/ui/CustomToast";
import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { useMutation } from "@tanstack/react-query";

export interface CreateProjectData {
  videoId: string;
  videoUrl: string;
  clips: any[];
}

export interface ProcessVideoData {
  projectId: string;
}

export const useCreateProject = () => {
  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const { data: project, error } = await createProjectAction(data);
      if (error) throw new Error(error);
      return project;
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "An unexpected error occurred";
      const logOutput = conditionalLog(
        {
          action: "create_project_failed",
          error: errorMessage,
          stack: error.stack,
        },
        { label: LOG_LABELS.VIDEO }
      );
      if (logOutput) {
        console.log(logOutput);
      }
      console.error("Failed to create project:", error);
      toast.error("Failed to create project", errorMessage);
    },
  });
};

export const useProcessVideo = (setCurrentJob: (job: any) => void) => {
  return useMutation({
    mutationFn: async (data: ProcessVideoData) => {
      const logOutput = conditionalLog(
        {
          action: "starting_video_processing",
          projectId: data.projectId,
        },
        { label: LOG_LABELS.VIDEO }
      );
      if (logOutput) {
        console.log(logOutput);
      }
      const { data: job, error } = await processVideoAction(data);
      if (error) throw new Error(error);
      const successLog = conditionalLog(
        {
          action: "processing_job_created",
          jobId: job?.id,
          status: job?.status,
        },
        { label: LOG_LABELS.VIDEO }
      );
      if (successLog) {
        console.log(successLog);
      }
      return job;
    },
    onSuccess: (job) => {
      if (job) {
        setCurrentJob(job);
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || "An unexpected error occurred";
      const logOutput = conditionalLog(
        {
          action: "process_video_failed",
          error: errorMessage,
          stack: error.stack,
        },
        { label: LOG_LABELS.VIDEO }
      );
      if (logOutput) {
        console.log(logOutput);
      }
      console.error("Failed to process video:", error);
      toast.error("Failed to process video", errorMessage);
    },
  });
};
