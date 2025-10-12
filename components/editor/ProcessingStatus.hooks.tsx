"use client";

import { useProcessingStore } from "@/app/page.stores";
import { useProcessingStatus } from "@/app/page.hooks";
import { JobStatus } from "@/app/page.types";

export const useProcessingStatusDisplay = () => {
  const { currentJob } = useProcessingStore();
  const { data: job, isLoading } = useProcessingStatus(currentJob?.id || null);

  const activeJob = job || currentJob;

  const getStatusText = (status: JobStatus | undefined) => {
    switch (status) {
      case "PENDING":
        return "Queued...";
      case "PROCESSING":
        return "Processing video...";
      case "COMPLETED":
        return "Video ready!";
      case "FAILED":
        return "Processing failed";
      default:
        return "";
    }
  };

  const handleDownload = () => {
    if (activeJob?.outputUrl) {
      window.open(activeJob.outputUrl, "_blank");
    }
  };

  return {
    job: activeJob,
    isLoading,
    statusText: getStatusText(activeJob?.status),
    canDownload: activeJob?.status === "COMPLETED" && !!activeJob.outputUrl,
    handleDownload,
  };
};
