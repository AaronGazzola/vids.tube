import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conditionalLog } from "@/lib/log.util";

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

    const workerUrl = process.env.WORKER_URL || "http://localhost:3001";
    const downloadUrl = `${workerUrl}/download/${jobId}`;

    const startLog = conditionalLog({ action: "download_proxy_start", jobId, downloadUrl }, { label: LOG_LABEL });
    if (startLog) console.log(startLog);

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      throw new Error(`Worker returned ${response.status}`);
    }

    const fileBuffer = await response.arrayBuffer();

    const readLog = conditionalLog({ action: "file_fetched", jobId, size: fileBuffer.byteLength }, { label: LOG_LABEL });
    if (readLog) console.log(readLog);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="video-${job.project.videoId}.mp4"`,
        "Content-Length": fileBuffer.byteLength.toString(),
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
