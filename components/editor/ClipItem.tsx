"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/time.utils";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { useClipItem } from "./ClipItem.hooks";
import { ClipItemProps } from "./ClipItem.types";

export function ClipItem({ clipId, index }: ClipItemProps) {
  const { clip, handleEdit, handleDelete } = useClipItem(clipId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: clipId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!clip) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors group",
        isDragging && "opacity-50"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-6 text-muted-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={handleEdit}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">Clip {index + 1}</span>
          <Badge
            variant="secondary"
            className="text-xs"
          >
            {formatTime(clip.duration)}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {formatTime(clip.startTime)} → {formatTime(clip.endTime)}
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          Crop: x{clip.cropX}, y{clip.cropY}, {clip.cropWidth}×{clip.cropHeight}
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Clip</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Clip {index + 1}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
