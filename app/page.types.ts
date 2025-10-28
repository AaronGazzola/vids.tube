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

export interface DateFilter {
  from?: Date;
  to?: Date;
}

export interface VideoQueryParams {
  search?: string;
  dateFilter?: DateFilter;
  minViews?: number;
  maxViews?: number;
  sort?: SortOption;
}
