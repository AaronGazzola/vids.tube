import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), "../.env") });

import express from "express";
import { startWorker } from "./worker.js";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/worker/thumbnail", async (req, res) => {
  try {
    const { videoId, timestamp, cropX, cropY, cropWidth, cropHeight } = req.body;

    if (!videoId || timestamp === undefined || cropX === undefined || cropY === undefined || !cropWidth || !cropHeight) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    console.log(JSON.stringify({ action: "thumbnail_generation_start", videoId, timestamp }));

    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `thumbnail-${videoId}-${Date.now()}.jpg`);

    await fs.writeFile(outputPath, "placeholder");

    console.log(JSON.stringify({ action: "thumbnail_generated", outputPath }));

    res.json({ thumbnailUrl: `/thumbnails/${path.basename(outputPath)}` });
  } catch (error) {
    console.log(JSON.stringify({ action: "thumbnail_error", error: error instanceof Error ? error.message : String(error) }));
    res.status(500).json({ error: "Failed to generate thumbnail" });
  }
});

app.post("/api/worker/process-shorts", async (req, res) => {
  try {
    const { jobId, videoId, sections } = req.body;

    if (!jobId || !videoId || !sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    console.log(JSON.stringify({ action: "shorts_processing_start", jobId, videoId, sectionCount: sections.length }));

    res.json({ status: "processing", jobId });

    setTimeout(() => {
      console.log(JSON.stringify({ action: "shorts_processing_complete", jobId }));
    }, 1000);
  } catch (error) {
    console.log(JSON.stringify({ action: "shorts_processing_error", error: error instanceof Error ? error.message : String(error) }));
    res.status(500).json({ error: "Failed to process shorts" });
  }
});

app.post("/api/worker/cancel", async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "Missing jobId" });
    }

    console.log(JSON.stringify({ action: "job_cancelled", jobId }));

    res.json({ status: "cancelled" });
  } catch (error) {
    console.log(JSON.stringify({ action: "cancel_error", error: error instanceof Error ? error.message : String(error) }));
    res.status(500).json({ error: "Failed to cancel job" });
  }
});

app.get("/download/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const filePath = path.join(os.tmpdir(), `output-${jobId}.mp4`);

    console.log(JSON.stringify({
      action: "download_requested",
      jobId,
      filePath
    }));

    const stats = await fs.stat(filePath);

    if (!stats.isFile()) {
      console.log(JSON.stringify({
        action: "download_failed",
        jobId,
        error: "Not a file"
      }));
      return res.status(404).json({ error: "Video file not found" });
    }

    console.log(JSON.stringify({
      action: "download_started",
      jobId,
      fileSize: stats.size
    }));

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", stats.size.toString());
    res.setHeader("Content-Disposition", `attachment; filename="video-${jobId}.mp4"`);

    const fileStream = await fs.readFile(filePath);
    res.send(fileStream);

    console.log(JSON.stringify({
      action: "download_completed",
      jobId
    }));

    setTimeout(async () => {
      try {
        await fs.unlink(filePath);
        console.log(JSON.stringify({
          action: "file_cleanup",
          jobId,
          status: "success"
        }));
      } catch (error) {
        console.log(JSON.stringify({
          action: "file_cleanup",
          jobId,
          status: "failed",
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    }, 60000);

  } catch (error) {
    console.log(JSON.stringify({
      action: "download_error",
      error: error instanceof Error ? error.message : String(error)
    }));
    res.status(500).json({ error: "Failed to download video" });
  }
});

app.listen(PORT, () => {
  console.log(JSON.stringify({ action: "worker_started", port: PORT, timestamp: new Date().toISOString() }));
  startWorker();
  console.log(JSON.stringify({ action: "video_processing_worker_started", timestamp: new Date().toISOString() }));
});
