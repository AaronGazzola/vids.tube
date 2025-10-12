# Video Processing Logging Guide

## Where to See Logs

### 1. Browser Console (DevTools)
**Location:** Open browser DevTools (F12) → Console tab

**What you'll see:**
- `starting_video_processing` - When you click "Process and download"
- `processing_job_created` - Job created with initial status
- `job_status_fetched` - Updates every 2 seconds with:
  - Current status
  - Current step (e.g., "Downloading video...")
  - Progress numbers
  - Current clip being processed

### 2. Server Terminal
**Location:** Terminal where `npm run dev` is running

**What you'll see:**
- `start_processing` - API received request
- `background_process_started` - Background processing initiated
- `job_progress_updated` - Each time progress updates
- `starting_download_step` - Beginning video download
- `download_start` - YouTube download starting
- `fetching_video_info` - Getting video metadata
- `got_video_info` - Video title, duration, author
- `download_progress` - Download progress every 10%
- `download_complete` - Download finished with file size
- `processing_individual_clip` - Starting each clip
- `ffmpeg_starting_clip_extraction` - FFmpeg command starting
- `ffmpeg_clip_progress` - FFmpeg progress for clip
- `ffmpeg_clip_complete` - Clip finished
- `starting_concatenation_step` - Merging clips
- `ffmpeg_concat_progress` - Concatenation progress
- `processing_complete` - Everything done

### 3. Toast Notification
**Location:** Bottom-right of screen (persistent during processing)

**What you'll see:**
- Icon indicating status (clock/spinner/checkmark/error)
- Main text showing current step:
  - "Queued..." (PENDING)
  - "Downloading video..." (step 1)
  - "Processing clip 2 of 5..." (step 2, per clip)
  - "Merging clips..." (step 3)
  - "Finalizing..." (step 4)
  - "Complete" / "Failed"
- Progress details below:
  - "Clip 2/5 • Step 3/4"

## Log Labels

Configured in `.env`:
```
NEXT_PUBLIC_LOG_LABELS="all"
```

Available labels:
- `all` - All logs
- `video` - Client-side video operations
- `video-processing` - Video processing operations
- `video-download` - YouTube download operations
- `api-process` - API processing route
- `api-status` - API status route

## Testing the Logs

1. Open browser DevTools Console
2. Open terminal with `npm run dev`
3. Click "Process and download"
4. Watch both locations for logs
5. Toast should update every 2 seconds with current progress

## Troubleshooting

**No logs appearing:**
- Check `.env` has `NEXT_PUBLIC_LOG_LABELS="all"`
- Restart dev server after changing .env
- Check browser console isn't filtering logs
- Check server terminal is visible

**Toast shows "Queued" forever:**
- Check server terminal for errors
- Database migration may not have run - run `npx prisma migrate dev`
- Check Prisma Studio to see if job fields exist
