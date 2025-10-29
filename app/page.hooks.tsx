"use client";

import { conditionalLog, LOG_LABELS } from "@/lib/log.util";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getVideosAction, getVideosPaginatedAction } from "./page.actions";
import { VideoQueryParams, PaginatedVideosResponse } from "./page.types";

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

export const useGetVideosInfinite = (params?: Omit<VideoQueryParams, "cursor">) => {
  return useInfiniteQuery<PaginatedVideosResponse, Error, PaginatedVideosResponse, [string, typeof params], string | undefined>({
    queryKey: ["videos-infinite", params],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await getVideosPaginatedAction({
        ...params,
        cursor: pageParam,
      });
      if (error || !data) throw new Error(error || "Failed to fetch videos");

      const logOutput = conditionalLog(
        {
          action: "videos_paginated_fetched",
          count: data.videos.length || 0,
          cursor: pageParam,
          hasMore: data.hasMore,
          params,
        },
        { label: LOG_LABELS.API }
      );
      if (logOutput) {
        console.log(logOutput);
      }

      return data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined;
    },
    initialPageParam: undefined,
    staleTime: 1000 * 60 * 5,
  });
};
