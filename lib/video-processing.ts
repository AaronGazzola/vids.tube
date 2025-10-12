import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { downloadYouTubeVideo } from "./video-download";
import { ClipSegment, ProcessVideoOptions } from "./video-processing.types";
import { conditionalLog } from "./log.util";

const LOG_LABEL = "video-processing";

export async function processVideo(
  options: ProcessVideoOptions
): Promise<string> {
  const { videoId, clips, outputPath } = options;

  conditionalLog({ action: "process_start", videoId, clipCount: clips.length }, { label: LOG_LABEL });

  const tempDir = path.join(os.tmpdir(), `video-process-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  const downloadedVideoPath = path.join(tempDir, "source.mp4");

  try {
    const minStartTime = Math.min(...clips.map(c => c.startTime));
    const maxEndTime = Math.max(...clips.map(c => c.endTime));

    conditionalLog({ action: "calculated_time_range", minStartTime, maxEndTime }, { label: LOG_LABEL });

    await downloadYouTubeVideo({
      videoId,
      outputPath: downloadedVideoPath,
      startTime: minStartTime,
      endTime: maxEndTime,
    });

    const processedClipPaths: string[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const clipOutputPath = path.join(tempDir, `clip-${i}.mp4`);

      conditionalLog({ action: "processing_clip", clipIndex: i, clip }, { label: LOG_LABEL });

      const adjustedClip = {
        ...clip,
        startTime: clip.startTime - minStartTime,
        endTime: clip.endTime - minStartTime,
      };

      await processClip(downloadedVideoPath, adjustedClip, clipOutputPath);
      processedClipPaths.push(clipOutputPath);
    }

    conditionalLog({ action: "concatenating_clips", count: processedClipPaths.length }, { label: LOG_LABEL });

    await concatenateClips(processedClipPaths, outputPath);

    conditionalLog({ action: "cleaning_temp_files", tempDir }, { label: LOG_LABEL });

    await fs.rm(tempDir, { recursive: true, force: true });

    conditionalLog({ action: "process_complete", outputPath }, { label: LOG_LABEL });

    return outputPath;
  } catch (error) {
    conditionalLog({ action: "process_error", error }, { label: LOG_LABEL });

    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

    throw error;
  }
}

async function processClip(
  inputPath: string,
  clip: ClipSegment,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const duration = clip.endTime - clip.startTime;

    ffmpeg(inputPath)
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
      .output(outputPath)
      .on("end", () => {
        conditionalLog({ action: "clip_processed", outputPath }, { label: LOG_LABEL });
        resolve();
      })
      .on("error", (error: Error) => {
        conditionalLog({ action: "clip_processing_error", error: error.message }, { label: LOG_LABEL });
        reject(error);
      })
      .run();
  });
}

async function concatenateClips(
  clipPaths: string[],
  outputPath: string
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (clipPaths.length === 0) {
      reject(new Error("No clips to concatenate"));
      return;
    }

    if (clipPaths.length === 1) {
      await fs.copyFile(clipPaths[0], outputPath);
      resolve();
      return;
    }

    const listFilePath = path.join(path.dirname(clipPaths[0]), "concat-list.txt");
    const listContent = clipPaths.map((p) => `file '${p}'`).join("\n");

    await fs.writeFile(listFilePath, listContent);

    ffmpeg()
      .input(listFilePath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .output(outputPath)
      .on("end", () => {
        conditionalLog({ action: "concatenation_complete", outputPath }, { label: LOG_LABEL });
        resolve();
      })
      .on("error", (error: Error) => {
        conditionalLog({ action: "concatenation_error", error: error.message }, { label: LOG_LABEL });
        reject(error);
      })
      .run();
  });
}

export async function cleanupProcessedVideo(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
    conditionalLog({ action: "cleanup_complete", filePath }, { label: LOG_LABEL });
  } catch (error) {
    conditionalLog({ action: "cleanup_error", error }, { label: LOG_LABEL });
  }
}
