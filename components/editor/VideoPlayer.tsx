"use client";

import { useYouTubePlayer } from "./VideoPlayer.hooks";
import { VideoPlayerProps } from "./VideoPlayer.types";

export const VideoPlayer = ({
  videoId,
  onReady,
  onStateChange,
  onError,
}: VideoPlayerProps) => {
  const { containerRef } = useYouTubePlayer({
    videoId,
    onReady,
    onStateChange,
    onError,
  });

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
};
