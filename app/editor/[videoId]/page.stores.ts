import { create } from "zustand";
import { ProcessingState } from "./page.types";

export const useProcessingStore = create<ProcessingState>((set) => ({
  currentJob: null,
  setCurrentJob: (job) => set({ currentJob: job }),
  downloadedJobIds: new Set<string>(),
  markJobAsDownloaded: (jobId) => set((state) => ({
    downloadedJobIds: new Set(state.downloadedJobIds).add(jobId),
  })),
}));
