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
      const errorLog = conditionalLog({ action: "download_error", error: "Missing jobId parameter" }, { label: LOG_LABEL });
      if (errorLog) console.log(errorLog);
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
      include: { project: true },
    });

    if (!job) {
      const errorLog = conditionalLog({ action: "download_error", error: "Job not found", jobId }, { label: LOG_LABEL });
      if (errorLog) console.log(errorLog);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "COMPLETED") {
      const errorLog = conditionalLog({ action: "download_error", error: "Video not ready", jobId, status: job.status }, { label: LOG_LABEL });
      if (errorLog) console.log(errorLog);
      return NextResponse.json(
        { error: `Video is not ready yet (status: ${job.status})` },
        { status: 400 }
      );
    }

    const workerUrl = process.env.WORKER_URL;
    if (!workerUrl) {
      const errorLog = conditionalLog({ action: "download_error", error: "WORKER_URL not configured", jobId }, { label: LOG_LABEL });
      if (errorLog) console.log(errorLog);
      return NextResponse.json(
        { error: "Worker service not configured" },
        { status: 500 }
      );
    }

    const downloadUrl = `${workerUrl}/download/${jobId}`;

    const redirectLog = conditionalLog({ action: "download_redirect", jobId, downloadUrl, workerUrl }, { label: LOG_LABEL });
    if (redirectLog) console.log(redirectLog);

    return NextResponse.redirect(downloadUrl, 302);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorLog = conditionalLog({
      action: "download_error",
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      workerUrl: process.env.WORKER_URL
    }, { label: LOG_LABEL });
    if (errorLog) console.log(errorLog);
    console.error("Download error:", error);
    return NextResponse.json(
      { error: `Failed to download video: ${errorMessage}` },
      { status: 500 }
    );
  }
}
