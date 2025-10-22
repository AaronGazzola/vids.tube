# Video Storage Architecture

## Overview

This document outlines the video storage strategy for vids.tube, which pre-downloads and stores full videos to eliminate YouTube bot detection issues during clip creation.

## The Problem

Downloading videos on-demand from YouTube has several critical issues:

1. YouTube bot detection blocks requests from datacenter IPs (Railway)
2. Cookie authentication is unreliable and requires frequent refreshes
3. Each clip creation requires a full YouTube download (slow)
4. Rate limiting restricts downloads to ~300 videos/hour
5. Unpredictable failures create poor user experience

## The Solution: Pre-Download & Store

Instead of downloading from YouTube every time a user creates a clip:

1. Download full video ONCE when user adds it to their project
2. Store video file in cloud object storage (Cloudflare R2)
3. Create clips by processing the stored file (ffmpeg only, no yt-dlp)
4. Delete videos based on smart retention policy

## Architecture

```
┌─────────────────────────────────────────────┐
│ User adds video to project                  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ Check if video already downloaded           │
│ (deduplication - same YouTube URL)          │
└─────────────────┬───────────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
      ▼ (exists)              ▼ (new)
┌─────────────┐    ┌──────────────────────────┐
│ Link to     │    │ Queue background         │
│ project     │    │ download job             │
└─────────────┘    └──────────┬───────────────┘
                              │
                  ┌───────────▼───────────────┐
                  │ Download from YouTube     │
                  │ (with retry logic)        │
                  └───────────┬───────────────┘
                              │
                  ┌───────────▼───────────────┐
                  │ Upload to Cloudflare R2   │
                  └───────────┬───────────────┘
                              │
                  ┌───────────▼───────────────┐
                  │ Update video status:      │
                  │ READY + storageUrl        │
                  └───────────────────────────┘

┌─────────────────────────────────────────────┐
│ User creates clip                           │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ Download video from R2 to Railway worker    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ ffmpeg extracts & processes clip            │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ Return clip to user                         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│ Delete temp files from Railway              │
└─────────────────────────────────────────────┘
```

## Storage Provider: Cloudflare R2

### Why Cloudflare R2?

| Feature | Cloudflare R2 | AWS S3 | Supabase Storage |
|---------|---------------|---------|------------------|
| Storage cost | $0.015/GB/month | $0.023/GB/month | $25/month (Pro) |
| Egress cost | **$0.00** | $0.09/GB | $0.09/GB |
| Free tier | 10 GB storage | 5 GB storage | 1 GB |
| API | S3-compatible | S3 native | S3-compatible |

**Key advantage: FREE egress bandwidth**

Every time a clip is created, the full video must be downloaded from storage to the worker. With R2, this costs $0 regardless of volume.

### Cost Comparison Example

**Scenario:** 10 stored videos (26 GB), 100 clips created per month

**Download per clip:** 2.6 GB average (full video)
**Total bandwidth:** 100 × 2.6 GB = 260 GB/month

| Provider | Storage | Bandwidth | Total/Month |
|----------|---------|-----------|-------------|
| **Cloudflare R2** | $0.39 | $0.00 | **$0.39** |
| **AWS S3** | $0.60 | $23.40 | **$24.00** |
| **Supabase** | $25.00 | $5.40 | **$30.40** |

**At 500 clips/month (1,300 GB bandwidth):**

| Provider | Total/Month |
|----------|-------------|
| **Cloudflare R2** | **$0.39** |
| **AWS S3** | **$117.60** |
| **Supabase** | **$124.00** |

R2 wins by 300x at scale!

## Storage Costs by Volume

| Videos | Avg Length | Total Size | R2 Cost/Month |
|--------|-----------|------------|---------------|
| 10 | 3.5 hours | 26 GB | $0.39 |
| 50 | 3.5 hours | 131 GB | $1.97 |
| 100 | 3.5 hours | 262 GB | $3.93 |
| 500 | 3.5 hours | 1,310 GB | $19.65 |

Assumes 1080p at ~750 MB/hour.

## Video Retention Strategy

### Smart Retention (Recommended)

Instead of arbitrary limits like "latest 10 videos", use project-based retention:

```typescript
enum RetentionPriority {
  HIGH,    // In active projects (< 7 days old)
  MEDIUM,  // In inactive projects (< 30 days)
  LOW,     // Not in any project (< 7 days since orphaned)
  DELETE   // Not in any project (> 7 days since orphaned)
}
```

### Retention Rules

1. **Keep:** Videos in active projects (any age)
2. **Keep:** Videos in inactive projects (< 30 days)
3. **Keep:** Orphaned videos (< 7 days)
4. **Delete:** Orphaned videos (> 7 days)
5. **Optional hard cap:** Delete LRU videos if total count > 50

### Implementation

```typescript
async function cleanupVideos() {
  const orphanedCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const toDelete = await prisma.video.findMany({
    where: {
      projects: { none: {} },
      lastUsedAt: { lt: orphanedCutoff }
    }
  });

  for (const video of toDelete) {
    await r2Client.deleteObject({
      Bucket: process.env.R2_BUCKET,
      Key: video.storageKey
    });

    await prisma.video.delete({ where: { id: video.id } });

    console.log(JSON.stringify({
      action: "video_deleted",
      videoId: video.id,
      reason: "orphaned_expired"
    }));
  }

  const totalVideos = await prisma.video.count();
  if (totalVideos > 50) {
    const lru = await prisma.video.findMany({
      where: { projects: { none: {} } },
      orderBy: { lastUsedAt: 'asc' },
      take: totalVideos - 50
    });

    for (const video of lru) {
      await r2Client.deleteObject({
        Bucket: process.env.R2_BUCKET,
        Key: video.storageKey
      });

      await prisma.video.delete({ where: { id: video.id } });
    }
  }
}
```

Run this cleanup job:
- Daily via cron
- Or triggered when storage threshold is reached

## Video Deduplication

Multiple users can add the same YouTube video. Store it once, reference it multiple times:

```typescript
async function addVideoToProject(projectId: string, youtubeUrl: string) {
  const videoId = extractYoutubeId(youtubeUrl);

  let video = await prisma.video.findUnique({
    where: { youtubeId: videoId }
  });

  if (!video) {
    video = await prisma.video.create({
      data: {
        youtubeId: videoId,
        sourceUrl: youtubeUrl,
        status: "DOWNLOADING"
      }
    });

    await downloadQueue.add({
      videoId: video.id,
      youtubeUrl
    });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      videos: { connect: { id: video.id } }
    }
  });

  return video;
}
```

This saves:
- Storage costs (one copy instead of many)
- Download time (instant for duplicate requests)
- YouTube rate limits (fewer downloads)

## Database Schema

```prisma
model Video {
  id            String    @id @default(cuid())
  youtubeId     String    @unique
  sourceUrl     String
  status        VideoStatus @default(DOWNLOADING)
  storageUrl    String?
  storageKey    String?
  duration      Float?
  fileSize      BigInt?
  resolution    String?
  downloadedAt  DateTime?
  lastUsedAt    DateTime  @default(now())
  error         String?

  projects      Project[]
  clips         Clip[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum VideoStatus {
  DOWNLOADING
  READY
  FAILED
  DELETED
}
```

## Download Queue Implementation

### Background Worker

```typescript
import { Queue, Worker } from 'bullmq';

const downloadQueue = new Queue('video-downloads', {
  connection: redisConnection
});

const downloadWorker = new Worker('video-downloads', async (job) => {
  const { videoId, youtubeUrl } = job.data;

  try {
    await job.updateProgress(10);

    const tempPath = path.join(os.tmpdir(), `${videoId}.mp4`);
    await downloadWithRetry(youtubeUrl, {
      output: tempPath,
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
      mergeOutputFormat: "mp4",
      cookies: process.env.YT_COOKIES_PATH
    });

    await job.updateProgress(50);

    const stats = await fs.stat(tempPath);
    const fileStream = fs.createReadStream(tempPath);

    const storageKey = `videos/${videoId}.mp4`;
    await r2Client.putObject({
      Bucket: process.env.R2_BUCKET,
      Key: storageKey,
      Body: fileStream,
      ContentType: 'video/mp4',
      ContentLength: stats.size
    });

    await job.updateProgress(90);

    const storageUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${storageKey}`;

    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "READY",
        storageUrl,
        storageKey,
        fileSize: stats.size,
        downloadedAt: new Date()
      }
    });

    await fs.unlink(tempPath);

    await job.updateProgress(100);

    console.log(JSON.stringify({
      action: "video_downloaded",
      videoId,
      fileSize: stats.size
    }));

  } catch (error) {
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "FAILED",
        error: error instanceof Error ? error.message : String(error)
      }
    });

    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 2
});
```

## Clip Processing with Stored Videos

```typescript
async function processClipFromStorage(clipId: string) {
  const clip = await prisma.clip.findUnique({
    include: { video: true }
  });

  if (clip.video.status !== "READY") {
    throw new Error("Video not ready for processing");
  }

  const tempVideoPath = path.join(os.tmpdir(), `${clip.video.id}.mp4`);
  const tempClipPath = path.join(os.tmpdir(), `${clipId}.mp4`);

  const response = await fetch(clip.video.storageUrl);
  const fileStream = fs.createWriteStream(tempVideoPath);
  await finished(Readable.fromWeb(response.body).pipe(fileStream));

  await new Promise<void>((resolve, reject) => {
    const duration = clip.endTime - clip.startTime;

    ffmpeg(tempVideoPath)
      .setStartTime(clip.startTime)
      .setDuration(duration)
      .videoFilters([
        {
          filter: "crop",
          options: {
            w: clip.cropWidth,
            h: clip.cropHeight,
            x: clip.cropX,
            y: clip.cropY
          }
        }
      ])
      .outputOptions([
        "-preset ultrafast",
        "-crf 23"
      ])
      .output(tempClipPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });

  await fs.unlink(tempVideoPath);

  return tempClipPath;
}
```

## Optimization: HTTP Range Requests

For advanced optimization, download only the needed portion of the video:

```typescript
async function processClipWithRangeRequest(clip: Clip) {
  const byteRange = calculateByteRange(
    clip.startTime,
    clip.endTime,
    clip.video.duration,
    clip.video.fileSize
  );

  const response = await fetch(clip.video.storageUrl, {
    headers: {
      'Range': `bytes=${byteRange.start}-${byteRange.end}`
    }
  });

  const partialVideo = await response.arrayBuffer();
}
```

**Bandwidth savings:**
- Full video: 2.6 GB
- 30-second clip: ~15 MB
- Savings: 99.4%

**Complexity:** Requires precise calculations and MP4 format support.

## Benefits Summary

| Aspect | Before (On-Demand) | After (Pre-Download) |
|--------|-------------------|---------------------|
| **Bot Detection** | Every clip | Once per video |
| **Clip Speed** | 30-60 seconds | 5-10 seconds |
| **Reliability** | 60-80% | 99%+ |
| **Cookie Issues** | Constant | One-time |
| **YouTube Dependency** | Every request | Initial download only |
| **Cost (250 hrs)** | $0 | $2-3/month |
| **User Experience** | Slow, unreliable | Fast, reliable |

## Implementation Checklist

- [ ] Set up Cloudflare R2 account
- [ ] Install AWS SDK for JavaScript v3 (R2 uses S3-compatible API)
- [ ] Add R2 environment variables to Railway
- [ ] Update Prisma schema with Video model
- [ ] Implement download queue with BullMQ
- [ ] Create background download worker
- [ ] Update clip processor to use stored videos
- [ ] Implement retention/cleanup job
- [ ] Add video deduplication logic
- [ ] Update UI to show download progress
- [ ] Test full flow end-to-end

## Environment Variables

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=vids-tube-videos
R2_PUBLIC_DOMAIN=pub-xxxxx.r2.dev
```

## Monitoring & Alerts

Track these metrics:
- Total videos stored
- Total storage size (GB)
- Videos in each status (DOWNLOADING, READY, FAILED)
- Download success rate
- Average download time
- Orphaned video count
- Storage cost projection

Set up alerts for:
- Download failures (>10% failure rate)
- Storage exceeding budget threshold
- R2 API errors
- Videos stuck in DOWNLOADING status (>1 hour)

## Future Enhancements

1. **Multi-quality storage:** Store 720p and 1080p versions
2. **Thumbnail extraction:** Generate preview thumbnails during download
3. **Metadata extraction:** Store video metadata (title, description, etc.)
4. **Partial downloads:** Only download time ranges needed for clips
5. **CDN integration:** Use R2's CDN for faster global delivery
6. **Webhook notifications:** Alert users when video is ready
