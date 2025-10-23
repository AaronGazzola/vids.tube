"use client";

import { VideoCardProps } from "@/app/(home)/page.types";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, HardDrive } from "lucide-react";
import Link from "next/link";

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

  const formatFileSize = (bytes: bigint | null) => {
    if (!bytes) return "Unknown";
    const mb = Number(bytes) / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(2)} MB`;
  };
  return (
    <Link
      href={`/editor/${video.youtubeId}`}
      className={cn("block", className)}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative aspect-video bg-muted">
          {/* {video.storageUrl && (
            <video
              src={video.storageUrl}
              className="w-full h-full object-cover"
              preload="metadata"
            />
          )} */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold truncate">{video.youtubeId}</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {video.duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(video.duration)}</span>
              </div>
            )}
            {video.fileSize && (
              <div className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                <span>{formatFileSize(video.fileSize)}</span>
              </div>
            )}
          </div>
          {video.resolution && (
            <div className="text-xs text-muted-foreground">
              {video.resolution}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
