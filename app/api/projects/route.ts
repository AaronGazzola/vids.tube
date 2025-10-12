import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conditionalLog } from "@/lib/log.util";

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

    conditionalLog({ action: "create_project", videoId, clipCount: clips.length }, { label: LOG_LABEL });

    const project = await prisma.project.create({
      data: {
        userId: "temp-user",
        videoId,
        videoUrl,
        clips: JSON.stringify(clips),
      },
    });

    conditionalLog({ action: "project_created", projectId: project.id }, { label: LOG_LABEL });

    return NextResponse.json(project);
  } catch (error) {
    conditionalLog({ action: "create_project_error", error }, { label: LOG_LABEL });
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
