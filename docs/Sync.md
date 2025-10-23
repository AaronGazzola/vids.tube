# YouTube Channel Sync

This script syncs videos from the [@azanything](https://www.youtube.com/@azanything) YouTube channel to your local R2 storage and database.

## Prerequisites

### 1. Install yt-dlp

The script requires [yt-dlp](https://github.com/yt-dlp/yt-dlp) to download videos from YouTube.

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
pip3 install yt-dlp
```

**Verify installation:**
```bash
yt-dlp --version
```

### 2. Install ffmpeg

Required for extracting video metadata.

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

**Verify installation:**
```bash
ffmpeg -version
```

### 3. Environment Variables

Make sure your [.env.local](../.env.local) file contains:

```env
DATABASE_URL="postgresql://..."
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="vids-tube-videos"
R2_PUBLIC_DOMAIN="pub-xxxxx.r2.dev"
```

## Usage

### Run the sync script

```bash
npm run sync
```

### What it does

1. Fetches all video IDs from the @azanything YouTube channel
2. Queries the database for existing videos
3. Downloads only videos that aren't already in the database
4. For each new video:
   - Downloads from YouTube as MP4
   - Extracts metadata (duration, resolution, file size)
   - Uploads to R2 storage
   - Creates database record with status `READY`

### Output

The script outputs JSON logs in the format:

```json
{"action":"sync_started","channel":"@azanything"}
{"action":"fetching_channel_videos","channel":"@azanything"}
{"action":"channel_videos_fetched","count":42}
{"action":"sync_analysis","total":42,"existing":10,"missing":32}
{"action":"processing_video","current":1,"total":32,"youtubeId":"dQw4w9WgXcQ"}
{"action":"downloading_video","youtubeId":"dQw4w9WgXcQ"}
{"action":"download_complete","youtubeId":"dQw4w9WgXcQ","fileSize":12345678}
{"action":"uploading_to_r2","youtubeId":"dQw4w9WgXcQ","storageKey":"videos/dQw4w9WgXcQ.mp4"}
{"action":"upload_complete","youtubeId":"dQw4w9WgXcQ","storageUrl":"https://..."}
{"action":"database_updated","youtubeId":"dQw4w9WgXcQ"}
{"action":"sync_complete","downloaded":32}
```

## Troubleshooting

### "yt-dlp not found"

Install yt-dlp using the instructions above.

### "ffmpeg not found"

Install ffmpeg using the instructions above.

### "R2_BUCKET environment variable not set"

Make sure your [.env.local](../.env.local) file is properly configured with all R2 credentials.

### Download fails with YouTube errors

YouTube may rate-limit or block downloads. The script includes retry logic with exponential backoff. If downloads consistently fail, wait a few minutes and try again.

### Database connection fails

Make sure your `DATABASE_URL` is correctly set and the database is accessible.

## How it differs from the Worker

The sync script:
- Runs locally on your machine
- Downloads videos directly to R2 (bypasses BullMQ queue)
- Syncs the entire @azanything channel
- Only downloads missing videos

The worker:
- Runs on Railway (production)
- Uses BullMQ queue for job processing
- Downloads videos on-demand when users add them to projects
- Handles both video downloads and clip processing
