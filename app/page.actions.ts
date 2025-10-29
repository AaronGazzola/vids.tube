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
