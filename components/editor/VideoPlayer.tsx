"use client";

import { useEffect, useState } from "react";
import { CropFrame } from "./CropFrame";
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

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [containerRef]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div
        ref={containerRef}
        className="absolute inset-0"
      />
      {dimensions.width > 0 && dimensions.height > 0 && (
        <CropFrame
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
        />
      )}
    </div>
  );
};
