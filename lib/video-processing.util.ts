import { prisma } from "@/lib/prisma";
import { conditionalLog } from "@/lib/log.util";
import path from "path";
import os from "os";
import { downloadYouTubeVideo } from "@/lib/video-download";
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";

const LOG_LABEL = "video-processing";

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
    const progressLog = conditionalLog({
      action: "job_progress_updated",
      jobId,
      currentStep,
      progress,
      totalSteps,
      currentClip,
      totalClips
    }, { label: LOG_LABEL });
    if (progressLog) console.log(progressLog);
  } catch (error) {
    const errorLog = conditionalLog({
      action: "job_progress_update_failed",
      jobId,
      error
    }, { label: LOG_LABEL });
    if (errorLog) console.log(errorLog);
  }
}

export async function processVideoInBackground(
  jobId: string,
  project: { id: string; videoId: string; clips: unknown }
) {
  try {
    const bgLog = conditionalLog({
      action: "background_process_started",
      jobId,
      projectId: project.id
    }, { label: LOG_LABEL });
    if (bgLog) console.log(bgLog);

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "PROCESSING",
        currentStep: "Initializing...",
        progress: 0,
        totalSteps: 4,
      },
    });

    const clips = JSON.parse(project.clips as string);
    const outputPath = path.join(os.tmpdir(), `output-${jobId}.mp4`);

    const procLog = conditionalLog({
      action: "processing_video",
      jobId,
      clipCount: clips.length,
      outputPath
    }, { label: LOG_LABEL });
    if (procLog) console.log(procLog);

    await updateJobProgress(
      jobId,
      "Downloading video...",
      1,
      4,
      0,
      clips.length
    );

    const tempDir = path.join(os.tmpdir(), `video-process-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    const downloadedVideoPath = path.join(tempDir, "source.mp4");

    const dlStartLog = conditionalLog({
      action: "starting_download_step",
      jobId,
      videoId: project.videoId
    }, { label: LOG_LABEL });
    if (dlStartLog) console.log(dlStartLog);

    await downloadYouTubeVideo({
      videoId: project.videoId,
      outputPath: downloadedVideoPath,
    });

    const dlCompleteLog = conditionalLog({
      action: "download_step_complete",
      jobId
    }, { label: LOG_LABEL });
    if (dlCompleteLog) console.log(dlCompleteLog);

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

      const clipLog = conditionalLog({
        action: "processing_individual_clip",
        jobId,
        clipIndex: i + 1,
        totalClips: clips.length
      }, { label: LOG_LABEL });
      if (clipLog) console.log(clipLog);

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

      const clipDoneLog = conditionalLog({
        action: "clip_processed",
        jobId,
        clipIndex: i + 1
      }, { label: LOG_LABEL });
      if (clipDoneLog) console.log(clipDoneLog);
    }

    await updateJobProgress(
      jobId,
      "Merging clips...",
      3,
      4,
      clips.length,
      clips.length
    );

    const concatStartLog = conditionalLog({
      action: "starting_concatenation_step",
      jobId,
      clipCount: processedClipPaths.length
    }, { label: LOG_LABEL });
    if (concatStartLog) console.log(concatStartLog);

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

    const concatCompleteLog = conditionalLog({
      action: "concatenation_step_complete",
      jobId
    }, { label: LOG_LABEL });
    if (concatCompleteLog) console.log(concatCompleteLog);

    await updateJobProgress(
      jobId,
      "Finalizing...",
      4,
      4,
      clips.length,
      clips.length
    );

    await fs.rm(tempDir, { recursive: true, force: true });

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        currentStep: "Complete",
        progress: 4,
        outputUrl: `/api/projects/${project.id}/download?jobId=${jobId}`,
        completedAt: new Date(),
      },
    });

    const completeLog = conditionalLog({
      action: "processing_complete",
      jobId
    }, { label: LOG_LABEL });
    if (completeLog) console.log(completeLog);
  } catch (error) {
    const failLog = conditionalLog({
      action: "processing_failed",
      jobId,
      error
    }, { label: LOG_LABEL });
    if (failLog) console.log(failLog);

    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        currentStep: "Failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }
}
