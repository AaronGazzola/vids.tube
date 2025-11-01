"use client";

import { Toast } from "@/components/ui/Toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useShortsEditorStore } from "./page.stores";
import {
  createSectionAction,
  deleteSectionAction,
  getSectionsAction,
  updateSectionAction,
} from "./section.actions";
import { CreateSectionInput, UpdateSectionInput } from "./page.types";

export const useGetSections = (videoId: string) => {
  const { setSourceVideo, addSection } = useShortsEditorStore();

  return useQuery({
    queryKey: ["sections", videoId],
    queryFn: async () => {
      const { data, error } = await getSectionsAction(videoId);
      if (error) throw new Error(error);

      if (data) {
        data.forEach((section) => addSection(section));
      }

      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateSection = () => {
  const { addSection } = useShortsEditorStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSectionInput) => {
      const { data, error } = await createSectionAction(input);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: (data) => {
      if (data) {
        addSection(data);
        toast.custom(() => (
          <Toast
            variant="success"
            title="Section Created"
            message="Section has been created successfully"
          />
        ));
        queryClient.invalidateQueries({ queryKey: ["sections"] });
      }
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to Create Section"
          message={error.message}
        />
      ));
    },
  });
};

export const useUpdateSection = () => {
  const { updateSection } = useShortsEditorStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateSectionInput) => {
      const { data, error } = await updateSectionAction(input);
      if (error) throw new Error(error);
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ["sections"] });
      const previousSections = queryClient.getQueryData(["sections"]);

      updateSection(input.sectionId, {
        startTime: input.startTime,
        endTime: input.endTime,
        order: input.order,
      } as any);

      return { previousSections };
    },
    onSuccess: (data) => {
      if (data) {
        updateSection(data.id, data);
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
          title="Failed to Update Section"
          message={error.message}
        />
      ));
    },
  });
};

export const useDeleteSection = () => {
  const { deleteSection } = useShortsEditorStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionId: string) => {
      const { error } = await deleteSectionAction(sectionId);
      if (error) throw new Error(error);
    },
    onSuccess: (_data, sectionId) => {
      deleteSection(sectionId);
      toast.custom(() => (
        <Toast
          variant="success"
          title="Section Deleted"
          message="Section has been deleted successfully"
        />
      ));
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
    onError: (error: Error) => {
      toast.custom(() => (
        <Toast
          variant="error"
          title="Failed to Delete Section"
          message={error.message}
        />
      ));
    },
  });
};
