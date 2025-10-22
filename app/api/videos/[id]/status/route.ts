import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conditionalLog } from "@/lib/log.util";

const LOG_LABEL = "api-videos-status";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    conditionalLog({ action: "get_video_status", videoId: id }, { label: LOG_LABEL });

    const video = await prisma.video.findUnique({
      where: { id },
      select: {
        id: true,
        youtubeId: true,
        status: true,
        storageUrl: true,
        duration: true,
        fileSize: true,
        resolution: true,
        error: true,
        downloadedAt: true,
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(video);
  } catch (error) {
    conditionalLog({ action: "get_video_status_error", error }, { label: LOG_LABEL });
    return NextResponse.json(
      { error: "Failed to get video status" },
      { status: 500 }
    );
  }
}
