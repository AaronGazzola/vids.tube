# vids.tube

Create YouTube Shorts from long-form YouTube videos.

## Features

- Select YouTube videos by pasting a link
- Position and scale a portrait crop frame on the video
- Create multiple clips with different timestamps and crop positions
- Download all clips combined into a single video

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3
- Redis
- PostgreSQL (or use provided Neon DB)

### Installation

1. Install and start Redis:
```bash
brew install redis
brew services start redis
```

2. Install dependencies:
```bash
npm install
npm run install:worker
```

3. Set up environment variables in `.env`:
```env
DATABASE_URL="postgresql://..."
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
NEXT_PUBLIC_LOG_LABELS="all"
```

### Running the Application

Start both the Next.js app and worker service:

```bash
npm run dev
cd worker && npm run dev
```

- Main app: [http://localhost:3000](http://localhost:3000)
- Worker service: [http://localhost:3001](http://localhost:3001)

## How It Works

The application uses a distributed architecture with two services:

1. **Next.js App** (port 3000) - Web interface where users create video clips
2. **Worker Service** (port 3001) - Background processor that handles video processing

When a user requests video processing:
- The Next.js app adds a job to the Redis queue (BullMQ)
- The worker service picks up the job from the queue
- Worker downloads video sections using yt-dlp
- Worker processes clips with FFmpeg (crop, trim, concatenate)
- Worker updates job status in PostgreSQL
- User can download the processed video from the Next.js app

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- React Query
- BullMQ + Redis
- FFmpeg + yt-dlp

## Deployment

This application is designed to be deployed to Railway using a monorepo multi-service architecture.

### Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository connected to Railway
- PostgreSQL database (remote or Railway-hosted)

### Railway Deployment Architecture

The deployment consists of three Railway services in a single project:

1. **Next.js App** - Main web application
2. **Worker Service** - Video processing worker (Dockerized)
3. **Redis** - Queue management (Railway template)

### Step-by-Step Deployment Guide

#### 1. Create Railway Project from GitHub

1. Log in to [Railway](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway and select your repository
5. Railway will create your first service and automatically detect your Next.js application

#### 2. Add Redis Database

In the same Railway project, add Redis using one of these methods:

**Option A: Command Menu (Fastest)**
1. Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux)
2. Type "Redis" and select "Add Redis"

**Option B: Right-click Menu**
1. Right-click on the project canvas
2. Click "Database"
3. Click "Add Redis"

**Option C: New Button**
1. Click the "+ New" button on the project canvas
2. Select "Database"
3. Choose "Add Redis"

Railway will deploy a Redis instance from the official Docker image with auto-generated credentials.

#### 3. Add Worker Service

1. Click "+ New" on the project canvas
2. Select "GitHub Repo"
3. Choose the same repository (it will create a second service from the same repo)

#### 4. Configure Next.js Service

1. Click on your Next.js service, then go to "Settings" tab
2. Configure the following:
   - **Service Name**: `web` or `nextjs-app`
   - **Root Directory**: `/` (leave as default)
   - **Watch Paths**: `/,!worker/**` (prevents rebuilds when worker code changes)

3. Go to the "Variables" tab and add:
   ```
   DATABASE_URL=your_postgresql_connection_string
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=${{Redis.RAILWAY_PRIVATE_PORT}}
   REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
   NEXT_PUBLIC_LOG_LABELS=all
   ```

4. The service will automatically deploy

#### 5. Configure Worker Service

1. Click on the worker service, then go to "Settings" tab
2. Configure the following:
   - **Service Name**: `worker`
   - **Root Directory**: `worker`
   - **Watch Paths**: `/worker/**` (only rebuild when worker code changes)

3. Go to the "Variables" tab and add:
   ```
   DATABASE_URL=your_postgresql_connection_string
   REDIS_HOST=${{Redis.RAILWAY_PRIVATE_DOMAIN}}
   REDIS_PORT=${{Redis.RAILWAY_PRIVATE_PORT}}
   REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
   PORT=3001
   ```

4. The service will automatically deploy using the [worker/Dockerfile](worker/Dockerfile)

#### 6. Verify Deployment

1. Check that all three services show "Active" status
2. Click on the Next.js service to get the public URL
3. Test the worker health endpoint: `https://worker-url.railway.app/health`
4. Verify Redis connection in both services' logs

### Environment Variables Reference

Both services need access to:

- `DATABASE_URL` - Your PostgreSQL connection string
- `REDIS_HOST` - Use Railway's internal networking: `${{Redis.RAILWAY_PRIVATE_DOMAIN}}`
- `REDIS_PORT` - Use Railway's internal port: `${{Redis.RAILWAY_PRIVATE_PORT}}`
- `REDIS_PASSWORD` - Auto-generated by Railway: `${{Redis.REDIS_PASSWORD}}`

### Deployment Tips

**Watch Paths**: Configure watch paths to prevent unnecessary rebuilds. The Next.js service should ignore worker changes, and the worker service should only watch its own directory.

**Private Networking**: Railway services communicate via private networking using `${{ServiceName.VARIABLE}}` syntax. This is faster and more secure than public URLs.

**Logs**: Monitor deployment logs in each service's "Deployments" tab. Look for:
- Next.js: "Ready started server on 0.0.0.0:3000"
- Worker: "worker_started" log message
- Redis: Connection successful logs

**Automatic Deployments**: Railway automatically deploys on git push to your main branch. Use watch paths to control which services rebuild.

**Railway CLI**: Install Railway CLI for local testing with production environment:
```bash
npm i -g @railway/cli
railway login
railway link
railway run npm run dev
```

### Troubleshooting

**Worker Not Processing Jobs**: Verify Redis connection environment variables are using Railway's internal networking syntax (`${{Redis.RAILWAY_PRIVATE_DOMAIN}}`).

**Build Failures**: Check that the worker's Dockerfile includes all necessary dependencies (Python, FFmpeg, yt-dlp).

**Both Services Deploying on Every Push**: Configure watch paths in each service's settings to prevent unnecessary rebuilds.

**Database Connection Issues**: Ensure your remote PostgreSQL database allows connections from Railway's IP addresses (or use Railway's PostgreSQL template).

### Cost Optimization

Railway pricing is usage-based. To optimize costs:

- Use the $5/month Hobby plan for development
- Set watch paths to minimize unnecessary builds
- Monitor resource usage in Railway dashboard
- Consider using Railway's PostgreSQL if you don't have a remote database

### Scaling

Railway automatically handles scaling for web services. For the worker service:

- Increase replicas in service settings for parallel job processing
- Monitor queue depth in Redis
- Adjust worker concurrency in [worker/src/worker.ts](worker/src/worker.ts)
