"use client";

import { useState } from "react";
import { useShortsEditorStore } from "../page.stores";
import { useCreateClip } from "../clip.hooks";

export function ClipCreator({ videoId }: { videoId: string }) {
  const { selectedSectionId, currentTime } = useShortsEditorStore();
  const { mutate: createClip, isPending } = useCreateClip();
  const [cropArea, setCropArea] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  });

  const handleCreateClip = () => {
    if (!selectedSectionId) return;

    createClip({
      sectionId: selectedSectionId,
      videoId,
      timestamp: currentTime,
      cropX: cropArea.x,
      cropY: cropArea.y,
      cropWidth: cropArea.width,
      cropHeight: cropArea.height,
      previewX: 0.1,
      previewY: 0.1,
      previewScale: 1,
    });
  };

  if (!selectedSectionId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a section to create clips
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold">Create Clip</h3>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Crop Area</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="X"
            value={cropArea.x}
            onChange={(e) => setCropArea(prev => ({ ...prev, x: Number(e.target.value) }))}
            className="px-2 py-1 border rounded"
          />
          <input
            type="number"
            placeholder="Y"
            value={cropArea.y}
            onChange={(e) => setCropArea(prev => ({ ...prev, y: Number(e.target.value) }))}
            className="px-2 py-1 border rounded"
          />
          <input
            type="number"
            placeholder="Width"
            value={cropArea.width}
            onChange={(e) => setCropArea(prev => ({ ...prev, width: Number(e.target.value) }))}
            className="px-2 py-1 border rounded"
          />
          <input
            type="number"
            placeholder="Height"
            value={cropArea.height}
            onChange={(e) => setCropArea(prev => ({ ...prev, height: Number(e.target.value) }))}
            className="px-2 py-1 border rounded"
          />
        </div>
      </div>

      <button
        onClick={handleCreateClip}
        disabled={isPending}
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {isPending ? "Creating..." : "Create Clip"}
      </button>
    </div>
  );
}
