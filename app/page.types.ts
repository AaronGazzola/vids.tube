import { Project, ProcessingJob, JobStatus } from "@/lib/generated/prisma";
import { Clip } from "@/lib/clip.types";

export interface EditorLayoutConfig {
  showSidebar: boolean;
  sidebarWidth: number;
  mainAreaHeight: number;
}

export interface ResponsiveBreakpoint {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
}

export interface EditorPageState {
  currentJob: ProcessingJob | null;
  setCurrentJob: (job: ProcessingJob | null) => void;
  reset: () => void;
}

export interface CreateProjectData {
  videoId: string;
  videoUrl: string;
  clips: Clip[];
}

export interface ProcessVideoData {
  projectId: string;
}

export type { Project, ProcessingJob, JobStatus };
