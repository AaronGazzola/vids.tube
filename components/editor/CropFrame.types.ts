export interface CropPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropFrameBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

export interface DragEvent {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface ResizeEvent {
  handle: ResizeHandle;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  initialPosition: CropPosition;
}

export type ResizeHandle =
  | "nw"
  | "ne"
  | "sw"
  | "se"
  | "n"
  | "e"
  | "s"
  | "w";

export interface VideoBounds {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

export interface CropFrameProps {
  containerWidth: number;
  containerHeight: number;
  videoBounds: VideoBounds;
}
