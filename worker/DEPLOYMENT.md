# Worker Deployment Guide

## Railway Deployment

### Prerequisites

1. Railway CLI installed: `npm install -g @railway/cli`
2. YouTube cookies extracted (see [cookies/README.md](cookies/README.md))

### Environment Variables

Set these variables in Railway:

```bash
railway variables set DATABASE_URL="your-postgres-url"
railway variables set REDIS_URL="your-redis-url"
railway variables set YT_COOKIES_PATH="/app/cookies/cookies.txt"
```

Optional:
```bash
railway variables set YT_USER_AGENT="Mozilla/5.0..."
```

### Deploy Steps

1. Extract YouTube cookies locally (see [cookies/README.md](cookies/README.md))

2. Add cookies to Railway as a file:
   - Upload `cookies/cookies.txt` to your Railway project
   - Or use Railway volumes to persist the file

3. Deploy:
   ```bash
   railway up
   ```

### Health Check

The worker exposes a health check endpoint at `/health`:

```bash
curl https://your-worker-url.railway.app/health
```

Expected response:
```json
{"status":"ok"}
```

### Monitoring

Check worker logs:
```bash
railway logs --service worker
```

Monitor Redis queue:
```bash
railway run redis-cli -u $REDIS_URL
> LLEN bull:video-processing:wait
> LLEN bull:video-processing:active
> LLEN bull:video-processing:completed
> LLEN bull:video-processing:failed
```

## Docker Deployment (Alternative)

If you prefer Docker:

1. Build the image:
   ```bash
   docker build -t vids-tube-worker .
   ```

2. Run with environment variables:
   ```bash
   docker run -d \
     -e DATABASE_URL="your-postgres-url" \
     -e REDIS_URL="your-redis-url" \
     -e YT_COOKIES_PATH="/app/cookies/cookies.txt" \
     -v $(pwd)/cookies:/app/cookies \
     -p 3001:3001 \
     vids-tube-worker
   ```

## Troubleshooting

### DRM Protected Videos

Error: "This video is drm protected"

**Solution:**
1. Ensure cookies are properly extracted from a logged-in browser
2. Cookies must include authentication tokens (SAPISID, HSID, SSID)
3. Use the browser extension method from [cookies/README.md](cookies/README.md)

### Video Format Not Available

Error: "Requested format is not available"

**Possible causes:**
- Video is private or unlisted
- Video is age-restricted
- Video is region-locked
- Cookies are expired

**Solution:**
1. Verify you can access the video in your browser
2. Extract fresh cookies
3. Check if video requires authentication

### FFmpeg Timeout

Error: "FFmpeg timeout - process killed"

**Solution:**
- Increase timeout values in [processor.ts](src/processor.ts)
- Check available system resources
- Consider reducing video quality or clip length

### Redis Connection Issues

Error: "Redis connection failed"

**Solution:**
1. Verify REDIS_URL is correct
2. Check network connectivity
3. Ensure Redis is running and accessible
4. For Railway, verify Redis service is deployed

## Performance Tuning

### FFmpeg Settings

Current preset: `ultrafast` (fast processing, larger files)

For better compression (slower):
```typescript
outputOptions([
  "-preset medium",  // or "slow" for best compression
  "-crf 23",
  "-max_muxing_queue_size 9999",
  "-threads 4"  // increase for more CPU cores
])
```

### Timeout Values

Current timeouts:
- Section download: No explicit timeout (yt-dlp default)
- FFmpeg processing: 120 seconds per clip
- FFmpeg concatenation: 60 seconds

Adjust in [processor.ts](src/processor.ts) based on your video sizes.

### Resource Limits

Railway default:
- Memory: 512MB (upgrade for larger videos)
- CPU: Shared (upgrade for faster processing)

Monitor resource usage:
```bash
railway logs --service worker | grep -i "memory\|cpu"
```
