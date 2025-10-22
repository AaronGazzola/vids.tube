export interface VideoProcessingJobData {
  jobId: string;
  projectId: string;
  videoId: string;
  clips: Array<{
    startTime: number;
    endTime: number;
    cropX: number;
    cropY: number;
    cropWidth: number;
    cropHeight: number;
  }>;
}

export interface VideoProcessingJobResult {
  success: boolean;
  outputUrl?: string;
  error?: string;
}

export interface VideoDownloadJobData {
  videoId: string;
  youtubeId: string;
  sourceUrl: string;
}

export interface VideoDownloadJobResult {
  success: boolean;
  storageUrl?: string;
  storageKey?: string;
  duration?: number;
  fileSize?: number;
  resolution?: string;
  error?: string;
}
