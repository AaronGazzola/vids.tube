import ytDlpWrap from "yt-dlp-exec";
import { promises as fs } from "fs";
import path from "path";
import { conditionalLog } from "./log.util";

const LOG_LABEL = "video-download";

export interface DownloadOptions {
  videoId: string;
  outputPath: string;
  sections?: Array<{ startTime: number; endTime: number }>;
}

export async function downloadYouTubeVideo(
  options: DownloadOptions
): Promise<string> {
  const { videoId, outputPath, sections } = options;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  conditionalLog({ action: "download_start", videoId, videoUrl, sections }, { label: LOG_LABEL });

  try {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const ytDlpOptions: Record<string, unknown> = {
      output: outputPath,
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      mergeOutputFormat: "mp4",
    };

    if (sections && sections.length > 0) {
      const downloadSections = sections.map(s => `*${s.startTime}-${s.endTime}`).join(",");
      ytDlpOptions.downloadSections = downloadSections;
      conditionalLog({ action: "using_time_ranges", downloadSections }, { label: LOG_LABEL });
    }

    conditionalLog({ action: "starting_ytdlp", options: ytDlpOptions }, { label: LOG_LABEL });

    await ytDlpWrap(videoUrl, ytDlpOptions);

    conditionalLog({ action: "download_complete", outputPath }, { label: LOG_LABEL });

    return outputPath;
  } catch (error) {
    conditionalLog({ action: "download_failed", error }, { label: LOG_LABEL });
    throw error;
  }
}
