import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Clip } from '@/lib/clip.types';

interface CropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VideoBounds {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

interface EditorStore {
  videoId: string | null;
  storageUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  videoWidth: number;
  videoHeight: number;
  videoBounds: VideoBounds | null;
  cropFrame: CropPosition;
  clips: Clip[];
  playerInstance: HTMLVideoElement | null;
  setVideo: (videoId: string, storageUrl: string) => void;
  clearVideo: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVideoDimensions: (width: number, height: number) => void;
  setVideoBounds: (bounds: VideoBounds) => void;
  setCropFrame: (position: CropPosition) => void;
  resetCropFrame: () => void;
  addClip: (clip: Omit<Clip, "id" | "createdAt">) => void;
  removeClip: (id: string) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  reorderClips: (startIndex: number, endIndex: number) => void;
  clearClips: () => void;
  resetEditor: () => void;
  setPlayerInstance: (player: HTMLVideoElement | null) => void;
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
  videoId: null,
  storageUrl: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  videoWidth: 1920,
  videoHeight: 1080,
  videoBounds: null,
  cropFrame: DEFAULT_CROP_FRAME,
  clips: [],
  playerInstance: null,

  setVideo: (videoId, storageUrl) => set({ videoId, storageUrl }),
  clearVideo: () => set({ videoId: null, storageUrl: null }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVideoDimensions: (width, height) => set({ videoWidth: width, videoHeight: height }),
  setVideoBounds: (bounds) => set({ videoBounds: bounds }),
  setCropFrame: (position) => set({ cropFrame: position }),
  resetCropFrame: () => set({ cropFrame: DEFAULT_CROP_FRAME }),
  setPlayerInstance: (player) => set({ playerInstance: player }),

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

  resetEditor: () =>
    set({
      videoId: null,
      storageUrl: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      videoWidth: 1920,
      videoHeight: 1080,
      videoBounds: null,
      cropFrame: DEFAULT_CROP_FRAME,
      clips: [],
      playerInstance: null,
    }),
}),
    {
      name: 'editor-storage',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        videoId: state.videoId,
        storageUrl: state.storageUrl,
        clips: state.clips,
        cropFrame: state.cropFrame,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          const { videoUrl, ...rest } = persistedState;
          return { ...rest, storageUrl: null };
        }
        return persistedState;
      },
    }
  )
);

export const useVideoState = () =>
  useEditorStore((state) => ({
    videoId: state.videoId,
    storageUrl: state.storageUrl,
    setVideo: state.setVideo,
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
