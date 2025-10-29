"use server";

import { ActionResponse, getActionResponse } from "@/lib/action.utils";
import { prisma } from "@/lib/prisma";
import { Video, Prisma } from "@/lib/generated/prisma";
import { VideoQueryParams, PaginatedVideosResponse } from "./page.types";

export const getVideosAction = async (
  params?: VideoQueryParams
): Promise<ActionResponse<Video[]>> => {
  try {
    const where: Prisma.VideoWhereInput = {};

    if (params?.search) {
      where.title = {
        contains: params.search,
        mode: "insensitive",
      };
    }

    const orderBy: Prisma.VideoOrderByWithRelationInput = params?.sort
      ? {
          [params.sort.field]: {
            sort: params.sort.order,
            nulls: params.sort.order === "desc" ? "last" : "first"
          }
        }
      : { publishedAt: "desc" };

    const videos = await prisma.video.findMany({
      where,
      orderBy,
    });

    return getActionResponse({ data: videos });
  } catch (error) {
    return getActionResponse({ error });
  }
};

export const getVideosPaginatedAction = async (
  params?: VideoQueryParams
): Promise<ActionResponse<PaginatedVideosResponse>> => {
  try {
    const limit = params?.limit ?? 20;
    const where: Prisma.VideoWhereInput = {};

    if (params?.search) {
      where.title = {
        contains: params.search,
        mode: "insensitive",
      };
    }

    const orderBy: Prisma.VideoOrderByWithRelationInput = params?.sort
      ? {
          [params.sort.field]: {
            sort: params.sort.order,
            nulls: params.sort.order === "desc" ? "last" : "first"
          }
        }
      : { publishedAt: "desc" };

    const videos = await prisma.video.findMany({
      where,
      orderBy,
      take: limit + 1,
      ...(params?.cursor && {
        skip: 1,
        cursor: { id: params.cursor },
      }),
    });

    const hasMore = videos.length > limit;
    const returnedVideos = hasMore ? videos.slice(0, limit) : videos;
    const nextCursor = hasMore ? returnedVideos[returnedVideos.length - 1].id : null;

    return getActionResponse({
      data: {
        videos: returnedVideos,
        nextCursor,
        hasMore,
      },
    });
  } catch (error) {
    return getActionResponse({ error });
  }
};
