"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/useEditorStore";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ClipItem } from "./ClipItem";
import { ClipsListProps } from "./ClipsList.types";

export function ClipsList({ className }: ClipsListProps) {
  const clips = useEditorStore((state) => state.clips);
  const clearClips = useEditorStore((state) => state.clearClips);
  const reorderClips = useEditorStore((state) => state.reorderClips);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = clips.findIndex((clip) => clip.id === active.id);
      const newIndex = clips.findIndex((clip) => clip.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderClips(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className={cn("flex flex-col h-full border rounded-lg", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Clips ({clips.length})</h2>
        {clips.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearClips}
          >
            Clear All
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {clips.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8 text-center text-muted-foreground">
            <p>
              No clips yet. Create your first clip using the timeline controls.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={clips.map((clip) => clip.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="p-4 space-y-2">
                {clips.map((clip, index) => (
                  <ClipItem
                    key={clip.id}
                    clipId={clip.id}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </ScrollArea>
    </div>
  );
}
