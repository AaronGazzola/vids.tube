"use client";

import { ClipCreator } from "@/components/editor/ClipCreator";
import { ClipsList } from "@/components/editor/ClipsList";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { VideoPlayer } from "@/components/editor/VideoPlayer";
import { VideoPlayerWithControls } from "@/components/editor/VideoPlayerWithControls";
import { parseParam } from "@/lib/string.util";
import { useEditorStore } from "@/store/useEditorStore";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useGetVideo,
  useKeyboardShortcuts,
  useProcessingStatus,
  useProcessingToast,
} from "./page.hooks";
import { useProcessingStore } from "./page.stores";

export default function EditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { videoId: videoIdParam } = useParams();
  const videoId = parseParam(videoIdParam);
  const { data: video, isLoading, error } = useGetVideo(videoId);
  console.log({
    video,
  });
  const { setVideo } = useEditorStore();
  const currentJob = useProcessingStore((state) => state.currentJob);

  useEffect(() => {
    if (video && video.storageUrl) {
      setVideo(video.youtubeId, video.storageUrl);
    }
  }, [video, setVideo]);

  useKeyboardShortcuts();
  useProcessingStatus(currentJob?.id || null, !!currentJob?.id);
  const { isProcessing } = useProcessingToast();

  if (isLoading) {
    return (
      <EditorLayout>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading video...</p>
        </main>
      </EditorLayout>
    );
  }

  if (error || !video) {
    return (
      <EditorLayout>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive">Failed to load video</p>
            <p className="text-muted-foreground text-sm mt-2">
              {error ? String(error) : "Video not found"}
            </p>
          </div>
        </main>
      </EditorLayout>
    );
  }

  return (
    <EditorLayout>
      <main className="flex-1 flex flex-col overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <VideoPlayer />
          <VideoPlayerWithControls disabled={isProcessing} />
        </div>
      </main>

      <EditorLayout.Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      >
        <div className="space-y-6">
          <ClipCreator disabled={isProcessing} />
          <ClipsList disabled={isProcessing} />
        </div>
      </EditorLayout.Sidebar>
    </EditorLayout>
  );
}
