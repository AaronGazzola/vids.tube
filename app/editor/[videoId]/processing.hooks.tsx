"use client";

import { Toast } from "@/components/ui/Toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProcessingStore, useShortsEditorStore } from "./page.stores";
import {
  cancelProcessingAction,
  getProcessingStatusAction,
  startProcessingAction,
} from "./processing.actions";
import { StartProcessingInput } from "./page.types";

export const useStartProcessing = () => {
  const { setCurrentJob, updateProgress } = useProcessingStore();
  const { sections } = useShortsEditorStore();

  return useMutation({
    mutationFn: async (input: StartProcessingInput) => {
      for (const section of input.sections) {
        if (!section.clips || section.clips.length === 0) {
          throw new Error("Each section must have at least one clip");
        }
      }

      const { data, error } = await startProcessingAction(input);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        setCurrentJob(data);
        updateProgress(0, "Starting processing...");
        toast.custom(() => (
          <Toast
            variant="success"
            title="Processing Started"
            message="Your video is being processed"
          />
        ));
      }
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to Start Processing"
          message={error.message}
        />
      ));
    },
  });
};

export const useProcessingStatus = (jobId: string | null, enabled: boolean = true) => {
  const { setCurrentJob, updateProgress, clearJob } = useProcessingStore();

  return useQuery({
    queryKey: ["processingStatus", jobId],
    queryFn: async () => {
      if (!jobId) return null;

      const { data, error } = await getProcessingStatusAction(jobId);
      if (error) throw new Error(error);

      if (data) {
        setCurrentJob(data);
        updateProgress(data.progress, data.currentStep || "Processing...");

        if (data.status === "COMPLETED") {
          toast.custom(() => (
            <Toast
              variant="success"
              title="Processing Complete"
              message="Your video is ready"
            />
          ));
        }

        if (data.status === "FAILED") {
          toast.custom(() => (
            <Toast
              variant="error"
              title="Processing Failed"
              message={data.error || "An error occurred"}
            />
          ));
        }
      }

      return data;
    },
    enabled: enabled && !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "FAILED") {
        return false;
      }
      return 2000;
    },
    staleTime: 0,
  });
};

export const useCancelProcessing = () => {
  const { clearJob } = useProcessingStore();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await cancelProcessingAction(jobId);
      if (error) throw new Error(error);
    },
    onSuccess: () => {
      clearJob();
      toast.custom(() => (
        <Toast
          variant="success"
          title="Processing Cancelled"
          message="Processing has been cancelled"
        />
      ));
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to Cancel Processing"
          message={error.message}
        />
      ));
    },
  });
};
