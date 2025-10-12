import { create } from "zustand";
import { EditorPageState } from "./page.types";

const initialState = {
  currentJob: null,
};

export const useProcessingStore = create<EditorPageState>()((set) => ({
  ...initialState,
  setCurrentJob: (job) => set({ currentJob: job }),
  reset: () => set(initialState),
}));
