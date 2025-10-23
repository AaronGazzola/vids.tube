"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { R2VideoPlayer } from "./R2VideoPlayer";

export const VideoPlayer = () => {
  const storageUrl = useEditorStore((state) => state.storageUrl);

  if (!storageUrl) {
    return (
      <div className="relative w-full aspect-video rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No video loaded</p>
      </div>
    );
  }

  return <R2VideoPlayer storageUrl={storageUrl} />;
};
