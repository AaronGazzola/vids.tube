import { PrismaClient } from "@prisma/client";
import path from "path";
import os from "os";
import ytDlpWrap from "yt-dlp-exec";
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import { execSync } from "child_process";
import type { VideoProcessingJobData, VideoProcessingJobResult } from "./types.js";

const prisma = new PrismaClient();

try {
  const ffmpegPath = execSync("which ffmpeg", { encoding: "utf-8" }).trim();
  const ffprobePath = execSync("which ffprobe", { encoding: "utf-8" }).trim();

  if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
  if (ffprobePath) ffmpeg.setFfprobePath(ffprobePath);

  console.log(JSON.stringify({
    action: "ffmpeg_configured",
    ffmpegPath,
    ffprobePath
  }));
} catch (error) {
  console.log(JSON.stringify({
    action: "ffmpeg_path_detection_failed",
    error: error instanceof Error ? error.message : String(error)
  }));
}

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
      forceKeyframesAtCuts: true,
    };

    if (process.env.YT_COOKIES_PATH) {
      ytDlpOptions.cookies = process.env.YT_COOKIES_PATH;
    }

    if (process.env.YT_USER_AGENT) {
      ytDlpOptions.userAgent = process.env.YT_USER_AGENT;
    }

    try {
      await ytDlpWrap(videoUrl, ytDlpOptions);

      const stats = await fs.stat(sectionPath);
      if (!stats.isFile() || stats.size === 0) {
        throw new Error(`Downloaded section ${i} is invalid: size=${stats.size}`);
      }

      console.log(JSON.stringify({
        action: "section_downloaded",
        sectionIndex: i,
        fileSize: stats.size
      }));

      sectionPaths.push(sectionPath);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("drm protected") || errorMessage.includes("DRM")) {
        throw new Error("This video is DRM protected and cannot be downloaded. Please ensure you are logged in to YouTube and have valid cookies.");
      }
      if (errorMessage.includes("Requested format is not available")) {
        throw new Error("Video format not available. The video may be private, age-restricted, or region-locked.");
      }
      throw error;
    }
  }

  if (sectionPaths.length === 1) {
    await fs.copyFile(sectionPaths[0], outputPath);
  } else {
    const listFilePath = path.join(tempDir, "sections-concat-list.txt");
    const listContent = sectionPaths.map((p) => `file '${p}'`).join("\n");
    await fs.writeFile(listFilePath, listContent);

    await new Promise<void>((resolve, reject) => {
      let progressTimeout: NodeJS.Timeout;
      let stderrOutput = "";

      const resetProgressTimeout = () => {
        if (progressTimeout) clearTimeout(progressTimeout);
        progressTimeout = setTimeout(() => {
          console.log(JSON.stringify({
            action: "ffmpeg_concat_timeout",
            message: "FFmpeg concat taking longer than expected",
            stderr: stderrOutput
          }));
          reject(new Error("FFmpeg concat timeout"));
        }, 60000);
      };

      resetProgressTimeout();

      const command = ffmpeg()
        .input(listFilePath)
        .inputOptions(["-f concat", "-safe 0"])
        .outputOptions(["-c copy", "-max_muxing_queue_size 9999"])
        .output(outputPath)
        .on("start", (commandLine) => {
          console.log(JSON.stringify({
            action: "ffmpeg_concat_start",
            command: commandLine
          }));
        })
        .on("stderr", (stderrLine) => {
          stderrOutput += stderrLine + "\n";
        })
        .on("progress", (progress) => {
          resetProgressTimeout();
          console.log(JSON.stringify({
            action: "ffmpeg_concat_progress",
            percent: progress.percent || 0
          }));
        })
        .on("end", () => {
          clearTimeout(progressTimeout);
          resolve();
        })
        .on("error", (error: Error) => {
          clearTimeout(progressTimeout);
          console.log(JSON.stringify({
            action: "ffmpeg_concat_error",
            error: error.message,
            stderr: stderrOutput
          }));
          reject(error);
        });

      command.run();
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

    const downloadedStats = await fs.stat(downloadedVideoPath);
    if (!downloadedStats.isFile() || downloadedStats.size === 0) {
      throw new Error(`Downloaded video is invalid: size=${downloadedStats.size}`);
    }

    console.log(JSON.stringify({
      action: "video_downloaded",
      fileSize: downloadedStats.size
    }));

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
        let progressTimeout: NodeJS.Timeout;
        let stderrOutput = "";

        const resetProgressTimeout = () => {
          if (progressTimeout) clearTimeout(progressTimeout);
          progressTimeout = setTimeout(() => {
            console.log(JSON.stringify({
              action: "ffmpeg_timeout",
              clipIndex: i,
              message: "FFmpeg processing taking longer than expected",
              stderr: stderrOutput
            }));
            reject(new Error("FFmpeg timeout - process killed"));
          }, 120000);
        };

        resetProgressTimeout();

        const command = ffmpeg(downloadedVideoPath)
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
          .outputOptions([
            "-preset ultrafast",
            "-crf 23",
            "-max_muxing_queue_size 9999",
            "-threads 2"
          ])
          .output(clipOutputPath)
          .on("start", (commandLine) => {
            console.log(JSON.stringify({
              action: "ffmpeg_clip_start",
              clipIndex: i,
              command: commandLine
            }));
          })
          .on("stderr", (stderrLine) => {
            stderrOutput += stderrLine + "\n";
          })
          .on("progress", (progress) => {
            resetProgressTimeout();
            console.log(JSON.stringify({
              action: "ffmpeg_progress",
              clipIndex: i,
              percent: progress.percent || 0
            }));
          })
          .on("end", () => {
            clearTimeout(progressTimeout);
            resolve();
          })
          .on("error", (error: Error) => {
            clearTimeout(progressTimeout);
            console.log(JSON.stringify({
              action: "ffmpeg_error",
              clipIndex: i,
              error: error.message,
              stderr: stderrOutput
            }));
            reject(error);
          });

        command.run();
      });

      const stats = await fs.stat(clipOutputPath);
      if (!stats.isFile() || stats.size === 0) {
        throw new Error(`Processed clip ${i} is invalid: size=${stats.size}`);
      }

      console.log(JSON.stringify({
        action: "clip_processed",
        clipIndex: i,
        fileSize: stats.size
      }));

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
        let progressTimeout: NodeJS.Timeout;
        let stderrOutput = "";

        const resetProgressTimeout = () => {
          if (progressTimeout) clearTimeout(progressTimeout);
          progressTimeout = setTimeout(() => {
            console.log(JSON.stringify({
              action: "ffmpeg_final_merge_timeout",
              message: "FFmpeg final merge taking longer than expected",
              stderr: stderrOutput
            }));
            reject(new Error("FFmpeg final merge timeout"));
          }, 60000);
        };

        resetProgressTimeout();

        const command = ffmpeg()
          .input(listFilePath)
          .inputOptions(["-f concat", "-safe 0"])
          .outputOptions(["-c copy", "-max_muxing_queue_size 9999"])
          .output(outputPath)
          .on("start", (commandLine) => {
            console.log(JSON.stringify({
              action: "ffmpeg_final_merge_start",
              command: commandLine
            }));
          })
          .on("stderr", (stderrLine) => {
            stderrOutput += stderrLine + "\n";
          })
          .on("progress", (progress) => {
            resetProgressTimeout();
            console.log(JSON.stringify({
              action: "ffmpeg_final_merge_progress",
              percent: progress.percent || 0
            }));
          })
          .on("end", () => {
            clearTimeout(progressTimeout);
            resolve();
          })
          .on("error", (error: Error) => {
            clearTimeout(progressTimeout);
            console.log(JSON.stringify({
              action: "ffmpeg_final_merge_error",
              error: error.message,
              stderr: stderrOutput
            }));
            reject(error);
          });

        command.run();
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
