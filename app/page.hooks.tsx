"use client";

import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { useQuery } from "@tanstack/react-query";
import { getVideosAction } from "./page.actions";
import { VideoQueryParams } from "./page.types";

export const useGetVideos = (params?: VideoQueryParams) => {
  return useQuery({
    queryKey: ["videos", params],
    queryFn: async () => {
      const { data: videos, error } = await getVideosAction(params);
      if (error) throw new Error(error);

      const logOutput = conditionalLog(
        {
          action: "videos_fetched",
          count: videos?.length || 0,
          params,
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
