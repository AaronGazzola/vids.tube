import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { extractVideoId } from '@/lib/youtube';
import { Clip } from '@/lib/clip.types';

interface CropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface EditorStore {
  videoUrl: string | null;
  videoId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  cropFrame: CropPosition;
  clips: Clip[];
  setVideoUrl: (url: string) => void;
  clearVideo: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setCropFrame: (position: CropPosition) => void;
  resetCropFrame: () => void;
  addClip: (clip: Omit<Clip, "id" | "createdAt">) => void;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  reorderClips: (startIndex: number, endIndex: number) => void;
  clearClips: () => void;
  togglePlayback: () => void;
  seekTo: (time: number) => void;
  skipForward: (seconds: number) => void;
  skipBackward: (seconds: number) => void;
  resetEditor: () => void;
}

const DEFAULT_CROP_FRAME: CropPosition = {
  x: 0,
  y: 0,
  width: 300,
  height: 533,
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
  videoUrl: null,
  videoId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  cropFrame: DEFAULT_CROP_FRAME,
  clips: [],

  setVideoUrl: (url) => {
    const videoId = extractVideoId(url);
    set({ videoUrl: url, videoId });
  },
  clearVideo: () => set({ videoUrl: null, videoId: null }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setCropFrame: (position) => set({ cropFrame: position }),
  resetCropFrame: () => set({ cropFrame: DEFAULT_CROP_FRAME }),

  addClip: (clip) =>
    set((state) => ({
      clips: [
        ...state.clips,
        {
          ...clip,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        },
      ],
    })),

  removeClip: (id) =>
    set((state) => ({
      clips: state.clips.filter((clip) => clip.id !== id),
    })),

  updateClip: (id, updates) =>
    set((state) => ({
      clips: state.clips.map((clip) =>
        clip.id === id ? { ...clip, ...updates } : clip
      ),
    })),

  reorderClips: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.clips);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { clips: result };
    }),

  clearClips: () => set({ clips: [] }),

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),

  seekTo: (time) => set({ currentTime: time }),

  skipForward: (seconds: number) =>
    set((state) => ({
      currentTime: Math.min(state.currentTime + seconds, state.duration),
    })),

  skipBackward: (seconds: number) =>
    set((state) => ({
      currentTime: Math.max(state.currentTime - seconds, 0),
    })),

  resetEditor: () =>
    set({
      videoUrl: null,
      videoId: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      cropFrame: DEFAULT_CROP_FRAME,
      clips: [],
    }),
}),
    {
      name: 'editor-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        videoUrl: state.videoUrl,
        videoId: state.videoId,
        clips: state.clips,
        cropFrame: state.cropFrame,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return persistedState;
        }
        return persistedState;
      },
    }
  )
);

export const useVideoState = () =>
  useEditorStore((state) => ({
    videoUrl: state.videoUrl,
    videoId: state.videoId,
    setVideoUrl: state.setVideoUrl,
    clearVideo: state.clearVideo,
  }));

export const usePlaybackState = () =>
  useEditorStore((state) => ({
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    duration: state.duration,
    setIsPlaying: state.setIsPlaying,
    setCurrentTime: state.setCurrentTime,
    setDuration: state.setDuration,
    togglePlayback: state.togglePlayback,
    seekTo: state.seekTo,
    skipForward: state.skipForward,
    skipBackward: state.skipBackward,
  }));

export const useCropFrame = () =>
  useEditorStore((state) => ({
    cropFrame: state.cropFrame,
    setCropFrame: state.setCropFrame,
    resetCropFrame: state.resetCropFrame,
  }));

export const useClips = () =>
  useEditorStore((state) => ({
    clips: state.clips,
    addClip: state.addClip,
    removeClip: state.removeClip,
    updateClip: state.updateClip,
    reorderClips: state.reorderClips,
    clearClips: state.clearClips,
  }));
