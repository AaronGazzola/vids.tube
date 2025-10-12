# Setup Guide

## Prerequisites

### Required Software

**Main App:**
- **Node.js** 20+ (with npm)
- **PostgreSQL** database
- **Redis** (for job queue)

**Worker Service:**
- **Node.js** 20+ (with npm)
- **Python** 2.7+ or 3.5+ (for yt-dlp video downloads)
- **PostgreSQL** database (shared with main app)
- **Redis** (shared with main app)
- **FFmpeg** (for video processing)

### Installing Python

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3
```

**Windows:**
Download from [python.org](https://www.python.org/downloads/)

### Installing FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

The postinstall script will automatically:
- Check for Python installation
- Create a Python wrapper if only `python3` is available
- Download the yt-dlp binary

3. Set up your environment variables in `.env.local`:
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_LOG_LABELS="all"
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

## Development

Start the development server:
```bash
npm run dev
```

## Troubleshooting

### Python Issues

If you see errors about Python not being found:
- Verify Python is installed: `python --version` or `python3 --version`
- Run the setup manually: `node scripts/setup-python.js`

### yt-dlp Issues

If video downloads fail:
- Check yt-dlp is installed: `node_modules/yt-dlp-exec/bin/yt-dlp --version`
- Rebuild the package: `npm rebuild yt-dlp-exec`

### Redis Issues

If job queueing fails:
- Verify Redis is running: `redis-cli ping` (should return "PONG")
- Check Redis connection in environment variables

### Worker Service

The video processing runs in a separate worker service. See `worker/README.md` for setup instructions.

**Local Development:**
1. Install Redis: `brew install redis` (macOS) or `sudo apt install redis` (Linux)
2. Start Redis: `redis-server`
3. In the `worker` directory: `npm install && npm run dev`

**Production Deployment:**
Deploy the worker as a separate service on Railway with FFmpeg and Python dependencies.
