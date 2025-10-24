import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conditionalLog } from "@/lib/log.util";
import { extractVideoId } from "@/lib/youtube";

const LOG_LABEL = "api-projects";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, videoUrl, clips } = body;

    if (!videoId || !videoUrl || !clips) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const youtubeId = extractVideoId(videoUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    conditionalLog({ action: "create_project", videoId, youtubeId, clipCount: clips.length }, { label: LOG_LABEL });

    const video = await prisma.video.findUnique({
      where: { youtubeId },
    });

    if (!video) {
      conditionalLog({ action: "video_not_found", youtubeId }, { label: LOG_LABEL });
      return NextResponse.json(
        { error: "Video not found. Please sync this video using the sync script." },
        { status: 404 }
      );
    }

    await prisma.video.update({
      where: { id: video.id },
      data: { lastUsedAt: new Date() },
    });

    conditionalLog({ action: "video_found", videoId: video.id, youtubeId }, { label: LOG_LABEL });

    const project = await prisma.project.create({
      data: {
        userId: "temp-user",
        videoId,
        videoUrl,
        clips: JSON.stringify(clips),
        videos: {
          connect: { id: video.id },
        },
      },
    });

    conditionalLog({ action: "project_created", projectId: project.id }, { label: LOG_LABEL });

    return NextResponse.json({
      ...project,
      video: {
        id: video.id,
        storageUrl: video.storageUrl,
      },
    });
  } catch (error) {
    conditionalLog({ action: "create_project_error", error }, { label: LOG_LABEL });
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
