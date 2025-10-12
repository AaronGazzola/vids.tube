export interface ClipSegment {
  startTime: number;
  endTime: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

export interface ProcessVideoOptions {
  videoId: string;
  clips: ClipSegment[];
  outputPath: string;
}

export interface ProcessingProgress {
  stage: "downloading" | "processing" | "finalizing" | "complete";
  percent: number;
  currentClip?: number;
  totalClips?: number;
}
