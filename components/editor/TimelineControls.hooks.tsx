import { useEditorStore } from "@/store/useEditorStore";
import { useCallback, useRef } from "react";

export function useTimelineControls() {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const {
    currentTime,
    duration,
    isPlaying,
    togglePlayback,
    seekTo,
    skipForward,
    skipBackward,
  } = useEditorStore();

  const handleSeek = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || duration === 0) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const time = percentage * duration;

      seekTo(time);
    },
    [duration, seekTo]
  );

  const handleSkipForward = useCallback(() => {
    skipForward(1);
  }, [skipForward]);

  const handleSkipBackward = useCallback(() => {
    skipBackward(1);
  }, [skipBackward]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    progressBarRef,
    currentTime,
    duration,
    isPlaying,
    progress,
    handleSeek,
    handleSkipForward,
    handleSkipBackward,
    togglePlayback,
  };
}
