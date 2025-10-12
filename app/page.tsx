"use client";

import { ClipCreator } from "@/components/editor/ClipCreator";
import { ClipsList } from "@/components/editor/ClipsList";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { VideoInput } from "@/components/editor/VideoInput";
import { VideoPlayerWithControls } from "@/components/editor/VideoPlayerWithControls";
import { useEditorStore } from "@/store/useEditorStore";
import { useState } from "react";
import { useKeyboardShortcuts, useProcessingToast } from "./page.hooks";

export default function EditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const videoId = useEditorStore((state) => state.videoId);

  useKeyboardShortcuts();
  const { isProcessing } = useProcessingToast();

  return (
    <EditorLayout>
      <main className="flex-1 flex flex-col overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <VideoInput disabled={isProcessing} />

          {videoId && <VideoPlayerWithControls videoId={videoId} disabled={isProcessing} />}
        </div>
      </main>

      <EditorLayout.Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      >
        <div className="space-y-6">
          {videoId && <ClipCreator disabled={isProcessing} />}
          <ClipsList disabled={isProcessing} />
        </div>
      </EditorLayout.Sidebar>
    </EditorLayout>
  );
}
