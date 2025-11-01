"use client";

import { cn } from "@/lib/utils";
import { useShortsEditorStore } from "../page.stores";
import { useCreateSection, useDeleteSection } from "../section.hooks";

export function SectionManager({ videoId }: { videoId: string }) {
  const { sections, selectedSectionId, selectSection, currentTime, timelineZoom, setTimelineZoom } = useShortsEditorStore();
  const { mutate: createSection } = useCreateSection();
  const { mutate: deleteSection } = useDeleteSection();

  const handleCreateSection = () => {
    const order = sections.length;
    createSection({
      videoId,
      startTime: currentTime,
      endTime: currentTime + 10,
      order,
    });
  };

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4">Sections</h2>
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleCreateSection}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Section
          </button>
          <select
            value={timelineZoom}
            onChange={(e) => setTimelineZoom(Number(e.target.value) as any)}
            className="px-2 py-1 border rounded"
          >
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sections.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No sections yet. Click "Add Section" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={() => selectSection(section.id)}
                className={cn(
                  "p-3 border rounded cursor-pointer transition-colors",
                  selectedSectionId === section.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Section {section.order + 1}</div>
                    <div className="text-sm text-gray-600">
                      {section.startTime.toFixed(2)}s - {section.endTime.toFixed(2)}s
                    </div>
                    <div className="text-xs text-gray-500">
                      {section.clips.length} clip{section.clips.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSection(section.id);
                    }}
                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
