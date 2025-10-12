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
import { useCreateProject, useProcessVideo } from "@/app/page.hooks";
import { Loader2, Play } from "lucide-react";

export function ClipsList({ className, disabled }: ClipsListProps) {
  const clips = useEditorStore((state) => state.clips);
  const clearClips = useEditorStore((state) => state.clearClips);
  const reorderClips = useEditorStore((state) => state.reorderClips);
  const videoId = useEditorStore((state) => state.videoId);
  const videoUrl = useEditorStore((state) => state.videoUrl);

  const createProject = useCreateProject();
  const processVideo = useProcessVideo();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: disabled ? 99999 : 0 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    if (disabled) return;
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = clips.findIndex((clip) => clip.id === active.id);
      const newIndex = clips.findIndex((clip) => clip.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderClips(oldIndex, newIndex);
      }
    }
  };

  const handleProcessVideo = async () => {
    if (!videoId || !videoUrl || clips.length === 0) return;

    const project = await createProject.mutateAsync({
      videoId,
      videoUrl,
      clips,
    });

    if (project?.id) {
      await processVideo.mutateAsync({ projectId: project.id });
    }
  };

  const isProcessing = createProject.isPending || processVideo.isPending;

  return (
    <div className={cn("flex flex-col h-full border rounded-lg", disabled && "opacity-50 pointer-events-none", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Clips ({clips.length})</h2>
        {clips.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearClips}
            disabled={disabled}
          >
            Clear All
          </Button>
        )}
      </div>

      {clips.length > 0 && (
        <div className="p-4 border-b">
          <Button
            onClick={handleProcessVideo}
            disabled={isProcessing || disabled}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Process & Download Video
              </>
            )}
          </Button>
        </div>
      )}

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
