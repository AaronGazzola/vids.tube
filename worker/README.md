# Video Processing Worker

Background worker service for processing YouTube videos with FFmpeg.

## Prerequisites

- Node.js 20+
- Python 3
- FFmpeg
- PostgreSQL
- Redis

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
DATABASE_URL="postgresql://..."
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
PORT=3001
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Start the worker:
```bash
npm run dev
```

## Railway Deployment

1. Create new Railway project
2. Add PostgreSQL plugin (shared with main app)
3. Add Redis plugin
4. Connect GitHub repo to `/worker` directory
5. Set environment variables:
   - `DATABASE_URL` (from PostgreSQL plugin)
   - `REDIS_HOST` (from Redis plugin)
   - `REDIS_PORT` (from Redis plugin)
   - `REDIS_PASSWORD` (from Redis plugin)
   - `PORT=3001`
6. Deploy

## Architecture

- Express server for health checks
- BullMQ worker processing video jobs from Redis queue
- Downloads only specified video sections using yt-dlp
- Processes clips with FFmpeg (crop, trim)
- Updates job status in PostgreSQL database
