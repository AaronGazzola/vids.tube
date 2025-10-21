# Railway Deployment Guide

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository connected to Railway
- PostgreSQL database
- YouTube cookies for video processing

## Quick Deploy

### 1. Create Railway Project

1. Log in to [Railway](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository

### 2. Add Redis

- Press `Cmd/Ctrl + K` → Type "Redis" → Select **"Add Redis"**

### 3. Add Worker Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the **same repository**

### 4. Configure Services

#### Next.js Service

**Settings:**
- Root Directory: `/` or empty
- Watch Paths: `/**,!worker/**`

**Variables:**
```env
DATABASE_URL=your_postgresql_connection_string
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
NEXT_PUBLIC_LOG_LABELS=all
```

#### Worker Service

**Settings:**
- Root Directory: `worker`
- Watch Paths: `worker/**`

**Variables:**
```env
DATABASE_URL=your_postgresql_connection_string
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
PORT=3001
YT_COOKIES_CONTENT=<paste contents of cookies.txt>
YT_COOKIES_PATH=/app/cookies/cookies.txt
YT_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### 5. Setup YouTube Cookies

1. Generate cookies locally:
   ```bash
   node scripts/generate-youtube-cookies.mjs
   ```

2. Copy contents of `worker/cookies/cookies.txt`

3. Add to Worker's `YT_COOKIES_CONTENT` environment variable

### 6. Deploy

Push to main branch. Railway will automatically deploy both services.

## Deploying Frontend to Vercel (Optional)

If deploying Next.js to Vercel instead of Railway:

1. Get Redis TCP Proxy from Railway:
   - Redis service → **Connect** tab → **TCP Proxy**

2. Add to Vercel environment variables:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   REDIS_HOST=<tcp-proxy-host>  # e.g., mainline.proxy.rlwy.net
   REDIS_PORT=<tcp-proxy-port>  # e.g., 59608
   REDIS_PASSWORD=<redis-password>
   NEXT_PUBLIC_LOG_LABELS=all
   ```

## Quick Troubleshooting

### FFmpeg Error 234 (Request interrupted)
- This error occurs when ffmpeg is killed due to resource limits
- The worker has been optimized with:
  - Progress monitoring to prevent timeout kills
  - Memory-efficient encoding settings (`-preset ultrafast`, `-threads 2`)
  - Increased muxing queue size
  - Proper timeout handling (2-minute timeout per clip)
- If issue persists, increase Railway service resource limits

### YouTube Bot Detection
- Regenerate cookies: `node scripts/generate-youtube-cookies.mjs`
- Update `YT_COOKIES_CONTENT` in Railway Worker variables

### Service Not Deploying
- Check Watch Paths are set correctly
- Trigger manual deploy: Service → Deploy → Deploy latest commit

### Worker Build Fails
- Verify Root Directory is set to `worker`
- Check `worker/Dockerfile` exists

### Redis Connection Error (from Vercel)
- Use TCP Proxy endpoint, not internal network
- Get correct host/port from Redis → Connect → TCP Proxy

## Environment Variables Reference

| Variable | Service | Required |
|----------|---------|----------|
| `DATABASE_URL` | Both | Yes |
| `REDIS_HOST` | Both | Yes |
| `REDIS_PORT` | Both | Yes |
| `REDIS_PASSWORD` | Both | Yes |
| `YT_COOKIES_CONTENT` | Worker | Yes |
| `YT_COOKIES_PATH` | Worker | Yes |
| `PORT` | Worker | Yes |
| `YT_USER_AGENT` | Worker | No |
| `NEXT_PUBLIC_LOG_LABELS` | Next.js | No |

## Notes

- Worker always stays on Railway (needs Docker for ffmpeg/yt-dlp)
- Frontend can be on Railway or Vercel
- Cookies expire periodically - regenerate when needed
- Use Railway's reference syntax for internal services: `${{Redis.VARIABLE}}`