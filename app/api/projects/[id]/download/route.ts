import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conditionalLog } from "@/lib/log.util";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { cleanupProcessedVideo } from "@/lib/video-processing";

const LOG_LABEL = "api-download";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Video is not ready yet" },
        { status: 400 }
      );
    }

    const filePath = path.join(os.tmpdir(), `output-${jobId}.mp4`);

    const startLog = conditionalLog({ action: "download_start", jobId, filePath }, { label: LOG_LABEL });
    if (startLog) console.log(startLog);

    const fileBuffer = await fs.readFile(filePath);

    const readLog = conditionalLog({ action: "file_read", jobId, size: fileBuffer.length }, { label: LOG_LABEL });
    if (readLog) console.log(readLog);

    cleanupProcessedVideo(filePath).catch(() => {});

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="video-${job.project.videoId}.mp4"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    const errorLog = conditionalLog({ action: "download_error", error }, { label: LOG_LABEL });
    if (errorLog) console.log(errorLog);
    return NextResponse.json(
      { error: "Failed to download video" },
      { status: 500 }
    );
  }
}
