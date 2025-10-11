import { Clip } from "@/lib/clip.types";

export interface ClipItemProps {
  clipId: string;
  index: number;
}

export interface UseClipItemReturn {
  clip: Clip | undefined;
  handleEdit: () => void;
  handleDelete: () => void;
}
