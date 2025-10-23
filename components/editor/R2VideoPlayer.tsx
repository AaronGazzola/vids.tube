"use client";

import { useEditorStore } from "@/store/useEditorStore";
import { useEffect, useMemo, useState } from "react";
import { CropFrame } from "./CropFrame";
import { useR2VideoPlayer } from "./R2VideoPlayer.hooks";
import { R2VideoPlayerProps } from "./R2VideoPlayer.types";
import { calculateVideoBounds } from "./VideoPlayer.utils";

export const R2VideoPlayer = ({
  storageUrl,
  onReady,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onError,
}: R2VideoPlayerProps) => {
  const { videoRef } = useR2VideoPlayer({
    storageUrl,
    onReady,
    onTimeUpdate,
    onDurationChange,
    onPlay,
    onPause,
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
      if (videoRef.current) {
        const rect = videoRef.current.getBoundingClientRect();
        if (rect.width && rect.height)
          setDimensions({ width: rect.width, height: rect.height });
      }
    };

    if (isMounted) updateDimensions();

    const observer = new ResizeObserver(updateDimensions);
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [videoRef, isMounted]);

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
    <div className="relative w-full aspect-video rounded-lg bg-black">
      <video
        ref={videoRef}
        src={storageUrl}
        className="absolute inset-0 w-full h-full object-contain"
        // style={{ zIndex: -1 }}
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
