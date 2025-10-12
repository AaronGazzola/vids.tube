"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useProcessingStore } from "./page.stores";
import {
  createProjectAction,
  processVideoAction,
  getProcessingJobAction,
} from "./page.actions";
import { CreateProjectData, ProcessVideoData } from "./page.types";
import { toast } from "sonner";
import { Toast } from "@/components/ui/Toast";
import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { ProcessingToast } from "@/components/editor/ProcessingToast";
import { useEffect, useRef } from "react";

export function useKeyboardShortcuts() {
  return null;
}

export const useCreateProject = () => {
  return useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const { data: project, error } = await createProjectAction(data);
      if (error) throw new Error(error);
      return project;
    },
    onError: (error: Error) => {
      const logOutput = conditionalLog(error, { label: LOG_LABELS.VIDEO });
      if (logOutput) {
        console.log(logOutput);
      }
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to create project"
          message={error.message || "An unexpected error occurred"}
        />
      ));
    },
  });
};

export const useProcessVideo = () => {
  const { setCurrentJob } = useProcessingStore();

  return useMutation({
    mutationFn: async (data: ProcessVideoData) => {
      const logOutput = conditionalLog({
        action: "starting_video_processing",
        projectId: data.projectId
      }, { label: LOG_LABELS.VIDEO });
      if (logOutput) {
        console.log(logOutput);
      }
      const { data: job, error } = await processVideoAction(data);
      if (error) throw new Error(error);
      const successLog = conditionalLog({
        action: "processing_job_created",
        jobId: job?.id,
        status: job?.status
      }, { label: LOG_LABELS.VIDEO });
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
      const logOutput = conditionalLog(error, { label: LOG_LABELS.VIDEO });
      if (logOutput) {
        console.log(logOutput);
      }
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to process video"
          message={error.message || "An unexpected error occurred"}
        />
      ));
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
      const logOutput = conditionalLog({
        action: "job_status_fetched",
        jobId,
        status: job?.status,
        currentStep: job?.currentStep,
        progress: job?.progress,
        currentClip: job?.currentClip
      }, { label: LOG_LABELS.VIDEO });
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
        toast.dismiss(toastIdRef.current);
      }

      toastIdRef.current = toast.custom(
        () => (
          <ProcessingToast
            status={currentJob.status}
            currentStep={currentJob.currentStep}
            progress={currentJob.progress}
            totalSteps={currentJob.totalSteps}
            currentClip={currentJob.currentClip}
            totalClips={currentJob.totalClips}
            error={currentJob.error}
            onClose={() => {
              if (toastIdRef.current) {
                toast.dismiss(toastIdRef.current);
                toastIdRef.current = null;
              }
              setCurrentJob(null);
            }}
          />
        ),
        {
          duration: currentJob.status === "COMPLETED" || currentJob.status === "FAILED" ? 5000 : Infinity,
        }
      );
    } else if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [currentJob, setCurrentJob]);

  return { isProcessing: currentJob?.status === "PENDING" || currentJob?.status === "PROCESSING" };
};
