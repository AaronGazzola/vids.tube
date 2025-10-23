"use client";

import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { useQuery } from "@tanstack/react-query";
import { getVideosAction } from "./page.actions";

export const useGetVideos = () => {
  return useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data: videos, error } = await getVideosAction();
      if (error) throw new Error(error);

      const logOutput = conditionalLog(
        {
          action: "videos_fetched",
          count: videos?.length || 0,
        },
        { label: LOG_LABELS.API }
      );
      if (logOutput) {
        console.log(logOutput);
      }

      return videos || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};
