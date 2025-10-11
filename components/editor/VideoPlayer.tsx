"use client";

import { useYouTubePlayer } from "@/components/editor/VideoPlayer.hooks";
import { useEditorStore } from "@/store/useEditorStore";
import { useEffect, useMemo, useState } from "react";
import { CropFrame } from "./CropFrame";
import { VideoPlayerProps } from "./VideoPlayer.types";
import { calculateVideoBounds } from "./VideoPlayer.utils";

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

  const setVideoBounds = useEditorStore((state) => state.setVideoBounds);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width && rect.height)
          setDimensions({ width: rect.width, height: rect.height });
      }
    };

    if (isMounted) updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [containerRef, isMounted]);

  const videoBounds = useMemo(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      return calculateVideoBounds(dimensions.width, dimensions.height);
    }
    return null;
  }, [dimensions.width, dimensions.height]);

  useEffect(() => {
    if (videoBounds) {
      setVideoBounds(videoBounds);
    }
  }, [videoBounds, setVideoBounds]);

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
      <div
        ref={containerRef}
        className="absolute inset-0 [&_iframe]:pointer-events-none"
        style={{ zIndex: -1 }}
      />

      {videoBounds && (
        <CropFrame
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
          videoBounds={videoBounds}
        />
      )}
    </div>
  );
};
