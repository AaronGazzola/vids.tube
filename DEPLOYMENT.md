# Deployment Guide

## Architecture Overview

This application consists of two separate services:

1. **Main App** (Next.js) - Handles UI and enqueues video processing jobs
2. **Worker Service** (Node.js) - Processes videos in the background with FFmpeg

Both services share:
- PostgreSQL database
- Redis queue

## Railway Deployment

### 1. Deploy Main App (Next.js)

1. Create new Railway project
2. Add PostgreSQL plugin
3. Add Redis plugin
4. Connect GitHub repo (root directory)
5. Set environment variables:
   - `DATABASE_URL` (auto-set by PostgreSQL plugin)
   - `REDIS_HOST` (from Redis plugin)
   - `REDIS_PORT` (from Redis plugin)
   - `REDIS_PASSWORD` (from Redis plugin)
   - `NEXT_PUBLIC_LOG_LABELS=all`
6. Deploy

### 2. Deploy Worker Service

1. In the same Railway project, add new service
2. Connect same GitHub repo, set root directory to `/worker`
3. Use existing PostgreSQL and Redis plugins (shared)
4. Set environment variables:
   - `DATABASE_URL` (same as main app)
   - `REDIS_HOST` (same as main app)
   - `REDIS_PORT` (same as main app)
   - `REDIS_PASSWORD` (same as main app)
   - `PORT=3001`
5. Deploy

### Environment Variables Summary

**Main App:**
```env
DATABASE_URL="postgresql://..."      # From PostgreSQL plugin
REDIS_HOST="..."                     # From Redis plugin
REDIS_PORT="..."                     # From Redis plugin
REDIS_PASSWORD="..."                 # From Redis plugin
NEXT_PUBLIC_LOG_LABELS="all"
```

**Worker Service:**
```env
DATABASE_URL="postgresql://..."      # Same as main app
REDIS_HOST="..."                     # Same as main app
REDIS_PORT="..."                     # Same as main app
REDIS_PASSWORD="..."                 # Same as main app
PORT=3001
```

## How It Works

1. User creates project with video clips in main app
2. Main app enqueues job to Redis queue
3. Worker picks up job from Redis
4. Worker downloads only specified video sections using yt-dlp
5. Worker processes each clip with FFmpeg (crop, trim)
6. Worker updates job status in database
7. Main app polls database for status updates
8. User downloads completed video from main app

## Monitoring

**Main App Health:**
- Check deployment logs in Railway
- Visit app URL to verify it loads

**Worker Health:**
- Visit `https://your-worker-url.railway.app/health`
- Check worker logs in Railway for job processing

**Redis Queue:**
- Use Redis CLI or Railway Redis plugin to inspect queue
- Queue name: `video-processing`

## Troubleshooting

**Jobs stuck in PENDING:**
- Check worker is running and healthy
- Verify worker can connect to Redis
- Check worker logs for errors

**Jobs failing immediately:**
- Check worker logs for specific errors
- Verify FFmpeg and Python are available in worker container
- Check DATABASE_URL is accessible from worker

**Video download failures:**
- yt-dlp may need updates (rebuild worker)
- Check YouTube video is accessible
- Verify network connectivity from worker
