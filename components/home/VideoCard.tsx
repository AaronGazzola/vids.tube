"use client";

import { VideoCardProps } from "@/app/page.types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Eye, ThumbsUp, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function VideoCard({ video, className }: VideoCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "Unknown";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const formatNumber = (num: number | null) => {
    if (!num) return "0";
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Link
      href={`/editor/${video.youtubeId}`}
      className={cn("block", className)}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative aspect-video bg-muted">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title || video.youtubeId}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No thumbnail
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {formatDuration(video.duration)}
            </div>
          )}
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">
            {video.title || video.youtubeId}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
            {video.viewCount !== null && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{formatNumber(video.viewCount)}</span>
              </div>
            )}
            {video.likeCount !== null && (
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3 w-3" />
                <span>{formatNumber(video.likeCount)}</span>
              </div>
            )}
          </div>
          {video.publishedAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(video.publishedAt)}</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
