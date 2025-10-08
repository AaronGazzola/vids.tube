import { useEditorStore } from "@/store/useEditorStore";
import { UseClipItemReturn } from "./ClipItem.types";

export function useClipItem(clipId: string): UseClipItemReturn {
  const clip = useEditorStore((state) =>
    state.clips.find((c) => c.id === clipId)
  );
  const removeClip = useEditorStore((state) => state.removeClip);
  const setCropFrame = useEditorStore((state) => state.setCropFrame);
  const seekTo = useEditorStore((state) => state.seekTo);
  const videoId = useEditorStore((state) => state.videoId);

  const handleEdit = () => {
    if (!clip) throw new Error("Clip not found");

    setCropFrame({
      x: clip.cropX,
      y: clip.cropY,
      width: clip.cropWidth,
      height: clip.cropHeight,
    });

    seekTo(clip.startTime);
  };

  const handleDelete = () => {
    removeClip(clipId);
  };

  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : "";

  return {
    clip,
    handleEdit,
    handleDelete,
    thumbnailUrl,
  };
}
