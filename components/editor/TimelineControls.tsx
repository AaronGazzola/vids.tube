"use client";

import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/time.utils";
import { cn } from "@/lib/utils";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useTimelineControls } from "./TimelineControls.hooks";
import type { TimelineControlsProps } from "./TimelineControls.types";
import { TimelineMarkers } from "./TimelineMarkers";

export function TimelineControls({ className }: TimelineControlsProps) {
  const {
    progressBarRef,
    currentTime,
    duration,
    isPlaying,
    progress,
    handleSeek,
    handleSkipForward,
    handleSkipBackward,
    togglePlayback,
  } = useTimelineControls();

  return (
    <div className={cn("flex flex-col gap-4 w-full", className)}>
      <div
        ref={progressBarRef}
        onClick={handleSeek}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer group"
      >
        <TimelineMarkers />
        <div
          className="absolute h-full bg-blue-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSkipBackward}
            disabled={duration === 0}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlayback}
            disabled={duration === 0}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleSkipForward}
            disabled={duration === 0}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}
