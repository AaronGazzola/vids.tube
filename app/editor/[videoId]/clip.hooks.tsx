"use client";

import { Toast } from "@/components/ui/Toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useShortsEditorStore } from "./page.stores";
import {
  createClipAction,
  deleteClipAction,
  generateClipThumbnailAction,
  updateClipAction,
} from "./clip.actions";
import { CreateClipInput, GenerateThumbnailInput, UpdateClipInput } from "./page.types";
import { useCallback, useRef } from "react";

export const useCreateClip = () => {
  const { addClip } = useShortsEditorStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateClipInput & { videoId: string; timestamp: number }) => {
      const thumbnailResult = await generateClipThumbnailAction({
        videoId: input.videoId,
        timestamp: input.timestamp,
        cropX: input.cropX,
        cropY: input.cropY,
        cropWidth: input.cropWidth,
        cropHeight: input.cropHeight,
      });

      if (thumbnailResult.error) {
        throw new Error(thumbnailResult.error);
      }

      const { data, error } = await createClipAction(input);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        addClip(data.sectionId, data);
        toast.custom(() => (
          <Toast
            variant="success"
            title="Clip Created"
            message="Clip has been created successfully"
          />
        ));
        queryClient.invalidateQueries({ queryKey: ["sections"] });
      }
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to Create Clip"
          message={error.message}
        />
      ));
    },
  });
};

export const useUpdateClip = () => {
  const { updateClip } = useShortsEditorStore();
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const debouncedUpdate = useCallback((input: UpdateClipInput) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const { data, error } = await updateClipAction(input);
      if (error) {
        toast.custom(() => (
          <Toast
            variant="error"
            title="Failed to Update Clip"
            message={error}
          />
        ));
      }
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["sections"] });
      }
    }, 500);
  }, [queryClient]);

  return useMutation({
    mutationFn: async (input: UpdateClipInput) => {
      const { data, error } = await updateClipAction(input);
      if (error) throw new Error(error);
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["sections"] });
      const previousSections = queryClient.getQueryData(["sections"]);

      updateClip(input.clipId, {
        previewX: input.previewX,
        previewY: input.previewY,
        previewScale: input.previewScale,
        zIndex: input.zIndex,
      } as any);

      return { previousSections };
    },
    onSuccess: (data) => {
      if (data) {
        updateClip(data.id, data);
        queryClient.invalidateQueries({ queryKey: ["sections"] });
      }
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSections) {
        queryClient.setQueryData(["sections"], context.previousSections);
      }
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to Update Clip"
          message={error.message}
        />
      ));
    },
  });
};

export const useDeleteClip = () => {
  const { deleteClip } = useShortsEditorStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clipId: string) => {
      const { error } = await deleteClipAction(clipId);
      if (error) throw new Error(error);
    },
    onSuccess: (_data, clipId) => {
      deleteClip(clipId);
      toast.custom(() => (
        <Toast
          variant="success"
          title="Clip Deleted"
          message="Clip has been deleted successfully"
        />
      ));
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to Delete Clip"
          message={error.message}
        />
      ));
    },
  });
};

export const useGenerateThumbnail = () => {
  return useMutation({
    mutationFn: async (input: GenerateThumbnailInput) => {
      const { data, error } = await generateClipThumbnailAction(input);
      if (error) throw new Error(error);
      return data;
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to Generate Thumbnail"
          message={error.message}
        />
      ));
    },
  });
};
