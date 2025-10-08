import { useState, useCallback, useRef } from "react";
import { useEditorStore } from "@/store/useEditorStore";
import type {
  CropPosition,
  CropFrameBounds,
  ResizeHandle,
} from "./CropFrame.types";

export const useDragFrame = (bounds: CropFrameBounds) => {
  const { cropFrame, setCropFrame } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, frameX: 0, frameY: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        frameX: cropFrame.x,
        frameY: cropFrame.y,
      };
    },
    [cropFrame.x, cropFrame.y]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      let newX = dragStartRef.current.frameX + deltaX;
      let newY = dragStartRef.current.frameY + deltaY;

      newX = Math.max(bounds.minX, Math.min(newX, bounds.maxX - cropFrame.width));
      newY = Math.max(bounds.minY, Math.min(newY, bounds.maxY - cropFrame.height));

      setCropFrame({ ...cropFrame, x: newX, y: newY });
    },
    [isDragging, cropFrame, setCropFrame, bounds]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return { isDragging, handleMouseDown, handleMouseMove, handleMouseUp };
};

export const useResizeFrame = (bounds: CropFrameBounds) => {
  const { cropFrame, setCropFrame } = useEditorStore();
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const resizeStartRef = useRef({
    x: 0,
    y: 0,
    position: { x: 0, y: 0, width: 0, height: 0 },
  });

  const ASPECT_RATIO = 9 / 16;

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setActiveHandle(handle);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        position: { ...cropFrame },
      };
    },
    [cropFrame]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !activeHandle) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      const initial = resizeStartRef.current.position;

      let newPosition: CropPosition = { ...initial };

      switch (activeHandle) {
        case "se":
        case "e":
          newPosition.width = Math.max(
            bounds.minWidth,
            Math.min(initial.width + deltaX, bounds.maxWidth - initial.x)
          );
          newPosition.height = newPosition.width / ASPECT_RATIO;
          break;

        case "sw":
        case "w":
          const newWidthW = Math.max(
            bounds.minWidth,
            Math.min(initial.width - deltaX, initial.x + initial.width - bounds.minX)
          );
          newPosition.width = newWidthW;
          newPosition.height = newWidthW / ASPECT_RATIO;
          newPosition.x = initial.x + initial.width - newWidthW;
          break;

        case "ne":
          const newWidthNE = Math.max(
            bounds.minWidth,
            Math.min(initial.width + deltaX, bounds.maxWidth - initial.x)
          );
          const newHeightNE = newWidthNE / ASPECT_RATIO;
          newPosition.width = newWidthNE;
          newPosition.height = newHeightNE;
          newPosition.y = initial.y + initial.height - newHeightNE;
          break;

        case "nw":
          const newWidthNW = Math.max(
            bounds.minWidth,
            Math.min(initial.width - deltaX, initial.x + initial.width - bounds.minX)
          );
          const newHeightNW = newWidthNW / ASPECT_RATIO;
          newPosition.width = newWidthNW;
          newPosition.height = newHeightNW;
          newPosition.x = initial.x + initial.width - newWidthNW;
          newPosition.y = initial.y + initial.height - newHeightNW;
          break;

        case "n":
          const newHeightN = Math.max(
            bounds.minHeight,
            Math.min(initial.height - deltaY, initial.y + initial.height - bounds.minY)
          );
          newPosition.height = newHeightN;
          newPosition.width = newHeightN * ASPECT_RATIO;
          newPosition.y = initial.y + initial.height - newHeightN;
          newPosition.x = initial.x + (initial.width - newPosition.width) / 2;
          break;

        case "s":
          const newHeightS = Math.max(
            bounds.minHeight,
            Math.min(initial.height + deltaY, bounds.maxHeight - initial.y)
          );
          newPosition.height = newHeightS;
          newPosition.width = newHeightS * ASPECT_RATIO;
          newPosition.x = initial.x + (initial.width - newPosition.width) / 2;
          break;
      }

      if (newPosition.y < bounds.minY) {
        newPosition = { ...newPosition, y: bounds.minY };
      }
      if (newPosition.y + newPosition.height > bounds.maxY) {
        const constrainedHeight = bounds.maxY - newPosition.y;
        newPosition = {
          ...newPosition,
          height: constrainedHeight,
          width: constrainedHeight * ASPECT_RATIO,
        };
      }

      setCropFrame(newPosition);
    },
    [isResizing, activeHandle, setCropFrame, bounds, ASPECT_RATIO]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setActiveHandle(null);
  }, []);

  return {
    isResizing,
    activeHandle,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  };
};

export const useCropFramePosition = () => {
  const cropFrame = useEditorStore((state) => state.cropFrame);
  const setCropFrame = useEditorStore((state) => state.setCropFrame);
  const resetCropFrame = useEditorStore((state) => state.resetCropFrame);

  return { cropFrame, setCropFrame, resetCropFrame };
};
