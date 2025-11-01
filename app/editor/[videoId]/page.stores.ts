import { create } from "zustand";
import { Clip } from "@/lib/generated/prisma";
import { ProcessingState, SectionWithClips, ShortsEditorState } from "./page.types";

const shortsEditorInitialState = {
  sourceVideo: null,
  sections: [],
  selectedSectionId: null,
  selectedClipId: null,
  currentTime: 0,
  isPlaying: false,
  timelineZoom: 1 as const,
  previewDimensions: { width: 1080, height: 1920 },
};

export const useShortsEditorStore = create<ShortsEditorState>((set) => ({
  ...shortsEditorInitialState,
  setSourceVideo: (video) => set({ sourceVideo: video }),
  addSection: (section) => set((state) => ({
    sections: [...state.sections, section].sort((a, b) => a.order - b.order),
  })),
  updateSection: (sectionId, updates) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    ),
  })),
  deleteSection: (sectionId) => set((state) => ({
    sections: state.sections.filter(s => s.id !== sectionId),
    selectedSectionId: state.selectedSectionId === sectionId ? null : state.selectedSectionId,
  })),
  reorderSections: (sections) => set({ sections }),
  selectSection: (sectionId) => set({ selectedSectionId: sectionId }),
  addClip: (sectionId, clip) => set((state) => ({
    sections: state.sections.map(s =>
      s.id === sectionId
        ? { ...s, clips: [...s.clips, clip].sort((a, b) => a.zIndex - b.zIndex) }
        : s
    ),
  })),
  updateClip: (clipId, updates) => set((state) => ({
    sections: state.sections.map(s => ({
      ...s,
      clips: s.clips.map(c => c.id === clipId ? { ...c, ...updates } : c),
    })),
  })),
  deleteClip: (clipId) => set((state) => ({
    sections: state.sections.map(s => ({
      ...s,
      clips: s.clips.filter(c => c.id !== clipId),
    })),
    selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
  })),
  selectClip: (clipId) => set({ selectedClipId: clipId }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setTimelineZoom: (zoom) => set({ timelineZoom: zoom }),
  reset: () => set(shortsEditorInitialState),
}));

const processingInitialState = {
  currentJob: null,
  processingStatus: "",
  progress: 0,
};

export const useProcessingStore = create<ProcessingState>((set) => ({
  ...processingInitialState,
  setCurrentJob: (job) => set({ currentJob: job }),
  updateProgress: (progress, status) => set({ progress, processingStatus: status }),
  clearJob: () => set({ currentJob: null, progress: 0, processingStatus: "" }),
  reset: () => set(processingInitialState),
}));
