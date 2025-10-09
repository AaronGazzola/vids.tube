"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { useDragFrame, useResizeFrame } from "./CropFrame.hooks";
import type { CropFrameProps, CropFrameBounds, ResizeHandle } from "./CropFrame.types";
import { useEditorStore } from "@/store/useEditorStore";

const RESIZE_HANDLES: ResizeHandle[] = ["nw", "ne", "sw", "se", "n", "e", "s", "w"];

export const CropFrame = ({ videoBounds }: CropFrameProps) => {
  const { cropFrame } = useEditorStore();

  const bounds: CropFrameBounds = {
    minX: videoBounds.offsetX,
    minY: videoBounds.offsetY,
    maxX: videoBounds.offsetX + videoBounds.width,
    maxY: videoBounds.offsetY + videoBounds.height,
    minWidth: 100,
    minHeight: 177,
    maxWidth: videoBounds.width,
    maxHeight: videoBounds.height,
  };

  const { isDragging, handleMouseDown, handleMouseMove, handleMouseUp } = useDragFrame(bounds);
  const {
    isResizing,
    activeHandle,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
  } = useResizeFrame(bounds);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const getHandleClassName = (handle: ResizeHandle) => {
    const baseClasses = "absolute bg-white border-2 border-blue-500 transition-all";
    const isCorner = ["nw", "ne", "sw", "se"].includes(handle);
    const sizeClasses = isCorner ? "w-3 h-3 rounded-full" : "bg-blue-500";

    const positionClasses = {
      nw: "-top-1.5 -left-1.5",
      ne: "-top-1.5 -right-1.5",
      sw: "-bottom-1.5 -left-1.5",
      se: "-bottom-1.5 -right-1.5",
      n: "top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full",
      s: "bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full",
      e: "right-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-full",
      w: "left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-full",
    }[handle];

    const cursorClasses = {
      nw: "cursor-nw-resize",
      ne: "cursor-ne-resize",
      sw: "cursor-sw-resize",
      se: "cursor-se-resize",
      n: "cursor-n-resize",
      s: "cursor-s-resize",
      e: "cursor-e-resize",
      w: "cursor-w-resize",
    }[handle];

    const activeClass = activeHandle === handle ? "scale-125" : "hover:scale-110";

    return cn(baseClasses, sizeClasses, positionClasses, cursorClasses, activeClass);
  };

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1000 }}>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1001 }}
      >
        <defs>
          <mask id="crop-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={cropFrame.x}
              y={cropFrame.y}
              width={cropFrame.width}
              height={cropFrame.height}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#crop-mask)"
        />
      </svg>

      <div
        className="absolute border-2 border-blue-500 shadow-lg pointer-events-auto cursor-move"
        style={{
          left: `${cropFrame.x}px`,
          top: `${cropFrame.y}px`,
          width: `${cropFrame.width}px`,
          height: `${cropFrame.height}px`,
          zIndex: 1002,
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-blue-300 border-opacity-30" />
          ))}
        </div>

        {RESIZE_HANDLES.map((handle) => (
          <div
            key={handle}
            className={getHandleClassName(handle)}
            onMouseDown={(e) => handleResizeStart(e, handle)}
          />
        ))}
      </div>
    </div>
  );
};
