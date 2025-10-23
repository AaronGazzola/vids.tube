import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import { R2VideoPlayerProps } from "./R2VideoPlayer.types";

export const useR2VideoPlayer = ({
  storageUrl,
  onReady,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  onError,
}: R2VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setCurrentTime, setDuration, setIsPlaying, setVideoDimensions, setPlayerInstance } = useEditorStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      onDurationChange?.(video.duration);

      setVideoDimensions(video.videoWidth, video.videoHeight);

      setPlayerInstance(video as any);
      onReady?.(video);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleError = () => {
      const errorMessage = video.error?.message || "Video failed to load";
      onError?.(errorMessage);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("error", handleError);
      setPlayerInstance(null);
    };
  }, [storageUrl, onReady, onTimeUpdate, onDurationChange, onPlay, onPause, onError, setCurrentTime, setDuration, setIsPlaying, setVideoDimensions, setPlayerInstance]);

  return {
    videoRef,
  };
};
