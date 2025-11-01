"use client";

import { cn } from "@/lib/utils";
import { useShortsEditorStore } from "../page.stores";

export function PreviewWindow() {
  const { sections, selectedSectionId, previewDimensions } = useShortsEditorStore();
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  const aspectRatio = previewDimensions.height / previewDimensions.width;

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Preview (9:16)</h3>
      <div
        className="bg-black mx-auto relative"
        style={{
          width: "300px",
          height: `${300 * aspectRatio}px`,
        }}
      >
        {selectedSection?.clips.map((clip) => (
          <div
            key={clip.id}
            className={cn(
              "absolute border-2 border-blue-500 bg-blue-500/10",
              "cursor-move"
            )}
            style={{
              left: `${clip.previewX * 100}%`,
              top: `${clip.previewY * 100}%`,
              width: `${(clip.cropWidth / previewDimensions.width) * clip.previewScale * 100}%`,
              height: `${(clip.cropHeight / previewDimensions.height) * clip.previewScale * 100}%`,
              zIndex: clip.zIndex,
            }}
          >
            {clip.thumbnailUrl && (
              <img
                src={clip.thumbnailUrl}
                alt="Clip"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        ))}

        {(!selectedSection || selectedSection.clips.length === 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            No clips to preview
          </div>
        )}
      </div>
    </div>
  );
}
