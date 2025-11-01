"use client";

import { cn } from "@/lib/utils";
import { useShortsEditorStore } from "../page.stores";
import { useDeleteClip } from "../clip.hooks";

export function ClipsList() {
  const { sections, selectedSectionId, selectedClipId, selectClip } = useShortsEditorStore();
  const { mutate: deleteClip } = useDeleteClip();
  const selectedSection = sections.find(s => s.id === selectedSectionId);

  if (!selectedSection) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a section to view clips
      </div>
    );
  }

  if (selectedSection.clips.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No clips in this section
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-4">Clips ({selectedSection.clips.length})</h3>
      <div className="space-y-2">
        {selectedSection.clips.map((clip) => (
          <div
            key={clip.id}
            onClick={() => selectClip(clip.id)}
            className={cn(
              "p-3 border rounded cursor-pointer",
              selectedClipId === clip.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-sm font-medium">Clip {clip.zIndex + 1}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Crop: {clip.cropWidth}x{clip.cropHeight}
                </div>
                <div className="text-xs text-gray-600">
                  Position: ({clip.previewX.toFixed(2)}, {clip.previewY.toFixed(2)})
                </div>
                <div className="text-xs text-gray-600">
                  Scale: {clip.previewScale.toFixed(2)}x
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteClip(clip.id);
                }}
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
