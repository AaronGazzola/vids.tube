import { ProcessingJob, Project, Video } from "@/lib/generated/prisma";
import { Clip } from "@/lib/clip.types";

export interface ProcessingState {
  currentJob: ProcessingJob | null;
  setCurrentJob: (job: ProcessingJob | null) => void;
}

export interface CreateProjectData {
  videoId: string;
  videoUrl: string;
  clips: Clip[];
}

export interface ProcessVideoData {
  projectId: string;
}

export interface EditorPageProps {
  params: {
    videoId: string;
  };
}
