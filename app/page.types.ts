import { Video } from "@/lib/generated/prisma";

export interface VideoCardProps {
  video: Video;
  className?: string;
}

export interface VideoGridProps {
  videos: Video[];
  className?: string;
}

export type SortField = "publishedAt" | "viewCount" | "likeCount" | "duration";
export type SortOrder = "asc" | "desc";

export interface SortOption {
  field: SortField;
  order: SortOrder;
}

export interface VideoQueryParams {
  search?: string;
  sort?: SortOption;
  limit?: number;
  cursor?: string;
}

export interface PaginatedVideosResponse {
  videos: Video[];
  nextCursor: string | null;
  hasMore: boolean;
}
