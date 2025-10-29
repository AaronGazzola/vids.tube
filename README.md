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
redis-server --daemonize yes
```

To verify Redis is running:

```bash
redis-cli ping
```

If the brew services command fails, use the direct command above. To stop Redis later, run `redis-cli shutdown`.

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

See [DEPLOYMENT_RAILWAY.md](DEPLOYMENT_RAILWAY.md) for the complete Railway deployment guide based on official Railway documentation.

**Quick Summary:**

This application deploys to Railway as three services:

1. **Next.js App** (root directory)
2. **Worker Service** (worker directory)
3. **Redis** (Railway database)

**Key Configuration:**

- **Next.js**: Root Directory `/`, Watch Paths `/,!worker/**`
- **Worker**: Root Directory `worker`, Watch Paths `/worker/**`
- **Environment Variables**: Use `${{Redis.REDISHOST}}` syntax for internal networking

The deployment guide covers:

- Step-by-step setup instructions
- Service configuration (Settings & Variables tabs)
- Environment variable reference syntax
- Config files (railway.json, railway.toml)
- Troubleshooting common issues
- Cost optimization tips
- Scaling strategies
<!-- deploy -->
