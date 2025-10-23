"use client";

import { VideoGrid } from "@/components/home/VideoGrid";
import { useGetVideos } from "./page.hooks";

export default function HomePage() {
  const { data: videos, isLoading, error } = useGetVideos();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Video Library</h1>
          <p className="text-muted-foreground mt-2">
            Select a video to start editing
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading videos...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <p className="text-destructive">Failed to load videos</p>
          </div>
        )}

        {!isLoading && !error && videos && <VideoGrid videos={videos} />}
      </main>
    </div>
  );
}
