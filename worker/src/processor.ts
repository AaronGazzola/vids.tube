import { PrismaClient } from "@prisma/client";
import path from "path";
import os from "os";
import ytDlpWrap from "yt-dlp-exec";
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import type { VideoProcessingJobData, VideoProcessingJobResult } from "./types.js";

const prisma = new PrismaClient();

async function updateJobProgress(
  jobId: string,
  currentStep: string,
  progress: number,
  totalSteps: number,
  currentClip?: number,
  totalClips?: number
) {
  try {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        currentStep,
        progress,
        totalSteps,
        currentClip: currentClip || 0,
        totalClips: totalClips || 0,
      },
    });
    console.log(JSON.stringify({
      action: "job_progress_updated",
      jobId,
      currentStep,
      progress,
      totalSteps,
      currentClip,
      totalClips
    }));
  } catch (error) {
    console.log(JSON.stringify({
      action: "job_progress_update_failed",
      jobId,
      error
    }));
  }
}

async function downloadVideoSections(
  videoId: string,
  outputPath: string,
  sections: Array<{ startTime: number; endTime: number }>,
  tempDir: string
): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const sectionPaths: string[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sectionPath = path.join(tempDir, `section-${i}.mp4`);
    const downloadSection = `*${section.startTime}-${section.endTime}`;

    console.log(JSON.stringify({
      action: "downloading_section",
      sectionIndex: i,
      downloadSection
    }));

    const ytDlpOptions: Record<string, unknown> = {
      output: sectionPath,
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      mergeOutputFormat: "mp4",
      downloadSections: downloadSection,
    };

    await ytDlpWrap(videoUrl, ytDlpOptions);
    sectionPaths.push(sectionPath);
  }

  if (sectionPaths.length === 1) {
    await fs.copyFile(sectionPaths[0], outputPath);
  } else {
    const listFilePath = path.join(tempDir, "sections-concat-list.txt");
    const listContent = sectionPaths.map((p) => `file '${p}'`).join("\n");
    await fs.writeFile(listFilePath, listContent);

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(listFilePath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c copy"])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (error: Error) => reject(error))
        .run();
    });

    for (const sectionPath of sectionPaths) {
      await fs.unlink(sectionPath);
    }
    await fs.unlink(listFilePath);
  }

  return outputPath;
}

export async function processVideo(
  data: VideoProcessingJobData
): Promise<VideoProcessingJobResult> {
  const { jobId, videoId, clips } = data;

  try {
    console.log(JSON.stringify({
      action: "processing_started",
      jobId,
      clipCount: clips.length
    }));

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "PROCESSING",
        currentStep: "Initializing...",
        progress: 0,
        totalSteps: 4,
      },
    });

    const tempDir = path.join(os.tmpdir(), `video-process-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    const outputPath = path.join(tempDir, `output-${jobId}.mp4`);

    await updateJobProgress(
      jobId,
      "Downloading video sections...",
      1,
      4,
      0,
      clips.length
    );

    const downloadedVideoPath = path.join(tempDir, "source.mp4");
    const sections = clips.map(c => ({
      startTime: c.startTime,
      endTime: c.endTime
    }));

    await downloadVideoSections(videoId, downloadedVideoPath, sections, tempDir);

    await updateJobProgress(
      jobId,
      "Processing clips...",
      2,
      4,
      0,
      clips.length
    );

    const processedClipPaths: string[] = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const clipOutputPath = path.join(tempDir, `clip-${i}.mp4`);

      await updateJobProgress(
        jobId,
        `Processing clip ${i + 1} of ${clips.length}...`,
        2,
        4,
        i + 1,
        clips.length
      );

      await new Promise<void>((resolve, reject) => {
        const duration = clip.endTime - clip.startTime;
        ffmpeg(downloadedVideoPath)
          .setStartTime(clip.startTime)
          .setDuration(duration)
          .videoFilters([
            {
              filter: "crop",
              options: {
                w: clip.cropWidth,
                h: clip.cropHeight,
                x: clip.cropX,
                y: clip.cropY,
              },
            },
          ])
          .output(clipOutputPath)
          .on("end", () => resolve())
          .on("error", (error: Error) => reject(error))
          .run();
      });

      processedClipPaths.push(clipOutputPath);
    }

    await updateJobProgress(
      jobId,
      "Merging clips...",
      3,
      4,
      clips.length,
      clips.length
    );

    if (processedClipPaths.length === 1) {
      await fs.copyFile(processedClipPaths[0], outputPath);
    } else {
      const listFilePath = path.join(tempDir, "concat-list.txt");
      const listContent = processedClipPaths.map((p) => `file '${p}'`).join("\n");
      await fs.writeFile(listFilePath, listContent);

      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(listFilePath)
          .inputOptions(["-f concat", "-safe 0"])
          .outputOptions(["-c copy"])
          .output(outputPath)
          .on("end", () => resolve())
          .on("error", (error: Error) => reject(error))
          .run();
      });
    }

    await updateJobProgress(
      jobId,
      "Finalizing...",
      4,
      4,
      clips.length,
      clips.length
    );

    const finalOutputPath = path.join(os.tmpdir(), `output-${jobId}.mp4`);
    await fs.copyFile(outputPath, finalOutputPath);

    await fs.rm(tempDir, { recursive: true, force: true });

    const outputUrl = `/api/projects/${data.projectId}/download?jobId=${jobId}`;

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        currentStep: "Complete",
        progress: 4,
        outputUrl,
        completedAt: new Date(),
      },
    });

    console.log(JSON.stringify({
      action: "processing_complete",
      jobId
    }));

    return { success: true, outputUrl };
  } catch (error) {
    console.log(JSON.stringify({
      action: "processing_failed",
      jobId,
      error
    }));

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        currentStep: "Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    await prisma.$disconnect();
  }
}
