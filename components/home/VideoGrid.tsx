"use client";

import { cn } from "@/lib/utils";
import { VideoCard } from "./VideoCard";
import { VideoGridProps } from "@/app/(home)/page.types";

export function VideoGrid({ videos, className }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-lg">No videos found</p>
        <p className="text-muted-foreground text-sm mt-2">
          Videos will appear here once they are synced from your YouTube channel
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}
    >
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
