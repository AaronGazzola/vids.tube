import { useEditorStore } from "@/store/useEditorStore";
import { UseClipItemReturn } from "./ClipItem.types";
import { convertFromVideoCoordinates } from "./VideoPlayer.utils";

export function useClipItem(clipId: string): UseClipItemReturn {
  const clip = useEditorStore((state) =>
    state.clips.find((c) => c.id === clipId)
  );
  const removeClip = useEditorStore((state) => state.removeClip);
  const setCropFrame = useEditorStore((state) => state.setCropFrame);
  const playerInstance = useEditorStore((state) => state.playerInstance);
  const videoBounds = useEditorStore((state) => state.videoBounds);

  const handleEdit = () => {
    if (!clip) throw new Error("Clip not found");
    if (!videoBounds) throw new Error("Video bounds not available");

    const containerCoords = convertFromVideoCoordinates(
      clip.cropX,
      clip.cropY,
      clip.cropWidth,
      clip.cropHeight,
      videoBounds
    );

    setCropFrame(containerCoords);

    if (playerInstance) {
      playerInstance.seekTo(clip.startTime, true);
    }
  };

  const handleDelete = () => {
    removeClip(clipId);
  };

  return {
    clip,
    handleEdit,
    handleDelete,
  };
}
