"use client";

import { ProcessingToast } from "@/components/editor/ProcessingToast";
import { toast } from "@/components/ui/CustomToast";
import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast as sonnerToast } from "sonner";
import { getVideoAction, getProcessingJobAction } from "./page.actions";
import { createProjectAction, processVideoAction } from "./shared.actions";
import { useProcessingStore } from "./page.stores";
import { CreateProjectData, ProcessVideoData } from "./page.types";

export function useKeyboardShortcuts() {
  return null;
}

export const useGetVideo = (youtubeId: string) => {
  return useQuery({
    queryKey: ["video", youtubeId],
    queryFn: async () => {
      const { data: video, error } = await getVideoAction(youtubeId);
      if (error) throw new Error(error);

      const logOutput = conditionalLog(
        {
          action: "video_fetched",
          youtubeId,
          status: video?.status,
        },
        { label: LOG_LABELS.API }
      );
      if (logOutput) {
        console.log(logOutput);
      }

      return video;
    },
    staleTime: 1000 * 60 * 5,
  });
};

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

export const useProcessVideo = () => {
  const { setCurrentJob } = useProcessingStore();

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

export const useProcessingStatus = (jobId: string | null, enabled = true) => {
  const { setCurrentJob } = useProcessingStore();

  const query = useQuery({
    queryKey: ["processing-job", jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const { data: job, error } = await getProcessingJobAction(jobId);
      if (error) throw new Error(error);
      const logOutput = conditionalLog(
        {
          action: "job_status_fetched",
          jobId,
          status: job?.status,
          currentStep: job?.currentStep,
          progress: job?.progress,
          currentClip: job?.currentClip,
        },
        { label: LOG_LABELS.VIDEO }
      );
      if (logOutput) {
        console.log(logOutput);
      }
      if (job) {
        setCurrentJob(job);
      }
      return job;
    },
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job?.status === "PROCESSING" || job?.status === "PENDING") {
        return 2000;
      }
      return false;
    },
  });

  return query;
};

export const useProcessingToast = () => {
  const { currentJob, setCurrentJob } = useProcessingStore();
  const toastIdRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (currentJob) {
      if (toastIdRef.current) {
        sonnerToast.dismiss(toastIdRef.current);
      }

      toastIdRef.current = sonnerToast.custom(
        () => (
          <ProcessingToast
            status={currentJob.status}
            currentStep={currentJob.currentStep}
            progress={currentJob.progress}
            totalSteps={currentJob.totalSteps}
            currentClip={currentJob.currentClip}
            totalClips={currentJob.totalClips}
            error={currentJob.error}
            outputUrl={currentJob.outputUrl}
            onClose={() => {
              if (toastIdRef.current) {
                sonnerToast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
              }
              setCurrentJob(null);
            }}
          />
        ),
        {
          duration:
            currentJob.status === "COMPLETED" || currentJob.status === "FAILED"
              ? 5000
              : Infinity,
        }
      );
    } else if (toastIdRef.current) {
      sonnerToast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    return () => {
      if (toastIdRef.current) {
        sonnerToast.dismiss(toastIdRef.current);
      }
    };
  }, [currentJob, setCurrentJob]);

  return {
    isProcessing:
      currentJob?.status === "PENDING" || currentJob?.status === "PROCESSING",
  };
};
