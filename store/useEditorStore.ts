import { create } from 'zustand';
import { extractVideoId } from '@/lib/youtube';

interface CropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Clip {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  createdAt: number;
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

export const useEditorStore = create<EditorStore>((set) => ({
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
}));
