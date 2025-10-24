"use server";

import { ActionResponse, getActionResponse } from "@/lib/action.utils";
import { prisma } from "@/lib/prisma";
import { Video } from "@/lib/generated/prisma";

export const getVideosAction = async (): Promise<ActionResponse<Video[]>> => {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        downloadedAt: "desc",
      },
    });

    return getActionResponse({ data: videos });
  } catch (error) {
    return getActionResponse({ error });
  }
};
