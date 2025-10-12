import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { conditionalLog } from "@/lib/log.util";

const LOG_LABEL = "api-status";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (jobId) {
      const job = await prisma.processingJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const jobLog = conditionalLog({ action: "get_job_status", jobId, status: job.status }, { label: LOG_LABEL });
      if (jobLog) console.log(jobLog);

      return NextResponse.json(job);
    }

    const jobs = await prisma.processingJob.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    const jobsLog = conditionalLog({ action: "get_project_jobs", projectId, count: jobs.length }, { label: LOG_LABEL });
    if (jobsLog) console.log(jobsLog);

    return NextResponse.json(jobs);
  } catch (error) {
    const errorLog = conditionalLog({ action: "status_error", error }, { label: LOG_LABEL });
    if (errorLog) console.log(errorLog);
    return NextResponse.json(
      { error: "Failed to get status" },
      { status: 500 }
    );
  }
}
