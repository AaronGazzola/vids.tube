import { Clip, Section, Video, ProcessingJob } from "@/lib/generated/prisma";

export interface SectionWithClips extends Section {
  clips: Clip[];
}

export interface ShortsEditorState {
  sourceVideo: Video | null;
  sections: SectionWithClips[];
  selectedSectionId: string | null;
  selectedClipId: string | null;
  currentTime: number;
  isPlaying: boolean;
  timelineZoom: 1 | 2 | 5 | 10;
  previewDimensions: { width: number; height: number };
  setSourceVideo: (video: Video | null) => void;
  addSection: (section: SectionWithClips) => void;
  updateSection: (sectionId: string, updates: Partial<SectionWithClips>) => void;
  deleteSection: (sectionId: string) => void;
  reorderSections: (sections: SectionWithClips[]) => void;
  selectSection: (sectionId: string | null) => void;
  addClip: (sectionId: string, clip: Clip) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  deleteClip: (clipId: string) => void;
  selectClip: (clipId: string | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setTimelineZoom: (zoom: 1 | 2 | 5 | 10) => void;
  reset: () => void;
}

export interface ProcessingState {
  currentJob: ProcessingJob | null;
  processingStatus: string;
  progress: number;
  setCurrentJob: (job: ProcessingJob | null) => void;
  updateProgress: (progress: number, status: string) => void;
  clearJob: () => void;
  reset: () => void;
}

export interface CreateSectionInput {
  videoId: string;
  startTime: number;
  endTime: number;
  order: number;
}

export interface UpdateSectionInput {
  sectionId: string;
  startTime?: number;
  endTime?: number;
  order?: number;
}

export interface CreateClipInput {
  sectionId: string;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  previewX: number;
  previewY: number;
  previewScale: number;
  zIndex?: number;
}

export interface UpdateClipInput {
  clipId: string;
  previewX?: number;
  previewY?: number;
  previewScale?: number;
  zIndex?: number;
}

export interface GenerateThumbnailInput {
  videoId: string;
  timestamp: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

export interface StartProcessingInput {
  videoId: string;
  sections: Array<{
    startTime: number;
    endTime: number;
    order: number;
    clips: Array<{
      cropX: number;
      cropY: number;
      cropWidth: number;
      cropHeight: number;
      previewX: number;
      previewY: number;
      previewScale: number;
      zIndex: number;
    }>;
  }>;
}

export interface EditorPageProps {
  params: Promise<{
    videoId: string;
  }>;
}
