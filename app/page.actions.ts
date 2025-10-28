"use server";

import { ActionResponse, getActionResponse } from "@/lib/action.utils";
import { prisma } from "@/lib/prisma";
import { Video, Prisma } from "@/lib/generated/prisma";
import { VideoQueryParams } from "./page.types";

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

    if (params?.dateFilter) {
      where.publishedAt = {};
      if (params.dateFilter.from) {
        where.publishedAt.gte = params.dateFilter.from;
      }
      if (params.dateFilter.to) {
        where.publishedAt.lte = params.dateFilter.to;
      }
    }

    if (params?.minViews !== undefined || params?.maxViews !== undefined) {
      where.viewCount = {};
      if (params.minViews !== undefined) {
        where.viewCount.gte = params.minViews;
      }
      if (params.maxViews !== undefined) {
        where.viewCount.lte = params.maxViews;
      }
    }

    const orderBy: Prisma.VideoOrderByWithRelationInput = params?.sort
      ? { [params.sort.field]: params.sort.order }
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
