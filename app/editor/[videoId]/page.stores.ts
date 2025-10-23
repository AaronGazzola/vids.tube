import { create } from "zustand";
import { ProcessingState } from "./page.types";

export const useProcessingStore = create<ProcessingState>((set) => ({
  currentJob: null,
  setCurrentJob: (job) => set({ currentJob: job }),
}));
