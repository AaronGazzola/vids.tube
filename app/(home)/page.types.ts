import { Video } from "@/lib/generated/prisma";

export interface VideoCardProps {
  video: Video;
  className?: string;
}

export interface VideoGridProps {
  videos: Video[];
  className?: string;
}
