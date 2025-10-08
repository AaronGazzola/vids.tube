"use client";

import { useEditorStore } from "@/store/useEditorStore";

export function TimelineMarkers() {
  const clips = useEditorStore((state) => state.clips);
  const duration = useEditorStore((state) => state.duration);
  const seekTo = useEditorStore((state) => state.seekTo);

  if (duration === 0 || clips.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {clips.map((clip, index) => {
        const startPercent = (clip.startTime / duration) * 100;
        const widthPercent = ((clip.endTime - clip.startTime) / duration) * 100;

        const colors = [
          "bg-blue-500/40",
          "bg-green-500/40",
          "bg-purple-500/40",
          "bg-orange-500/40",
          "bg-pink-500/40",
        ];
        const color = colors[index % colors.length];

        return (
          <div
            key={clip.id}
            className={`absolute top-0 h-full ${color} pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity`}
            style={{
              left: `${startPercent}%`,
              width: `${widthPercent}%`,
            }}
            onClick={() => seekTo(clip.startTime)}
            title={`Clip ${index + 1}: ${clip.startTime}s - ${clip.endTime}s`}
          />
        );
      })}
    </div>
  );
}
