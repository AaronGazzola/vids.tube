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
