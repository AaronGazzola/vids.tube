# Railway Deployment Guide

This document provides the official step-by-step guide for deploying vids.tube to Railway. All information is based on Railway's official documentation.

## Prerequisites

- Railway account ([railway.app](https://railway.app))
- GitHub repository connected to Railway
- PostgreSQL database (Railway-hosted or external)

## Architecture Overview

The deployment consists of three Railway services in a single project:

1. **Next.js App** - Main web application (root directory)
2. **Worker Service** - Video processing worker (worker directory)
3. **Redis** - Queue management (Railway database template)

## Step-by-Step Deployment

### 1. Create Railway Project

1. Log in to [Railway](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway and select your repository
5. Railway will automatically create the first service and detect the Next.js application

### 2. Add Redis Database

Add Redis using one of these methods:

**Command Menu (Recommended):**
- Press `Cmd + K` (Mac) or `Ctrl + K` (Windows/Linux)
- Type "Redis" and select **"Add Redis"**

**New Button:**
- Click **"+ New"** → **"Database"** → **"Add Redis"**

**Right-click:**
- Right-click canvas → **"Database"** → **"Add Redis"**

Railway automatically generates these environment variables:
- `REDISHOST`
- `REDISPORT`
- `REDISUSER`
- `REDISPASSWORD`
- `REDIS_URL`

### 3. Add PostgreSQL (Optional)

If you don't have an external database, use the same method to add PostgreSQL. Railway will auto-generate `DATABASE_URL`.

### 4. Add Worker Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select the **same repository** (creates second service from same repo)

### 5. Configure Next.js Service

#### Settings Tab

Navigate to the Next.js service → **Settings** tab:

- **Service Name**: `web` (optional)
- **Root Directory**: Empty or `/`
- **Watch Paths**: `/,!worker/**`

Watch paths use gitignore-style patterns. This configuration:
- Watches root directory
- Ignores worker directory
- Prevents rebuilds when only worker code changes

#### Variables Tab

Go to **Variables** tab and add:

```env
DATABASE_URL=your_postgresql_connection_string
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
NEXT_PUBLIC_LOG_LABELS=all
```

**Variable Reference Syntax:**
- `${{ServiceName.VARIABLE}}` - References variables from other services
- `${{shared.VARIABLE}}` - References shared project variables
- Uses Railway's internal networking (faster, more secure, no egress charges)

If using Railway PostgreSQL:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 6. Configure Worker Service

#### Settings Tab

Navigate to worker service → **Settings** tab:

- **Service Name**: `worker` (optional)
- **Root Directory**: `worker`
- **Watch Paths**: `/worker/**`

The root directory tells Railway to only use files from the worker folder. Watch paths ensure rebuilds only when worker code changes.

#### Variables Tab

Add the following variables:

```env
DATABASE_URL=your_postgresql_connection_string
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
PORT=3001
```

#### Build Configuration

Railway will automatically:
1. Detect [worker/railway.json](worker/railway.json)
2. Use Dockerfile builder as specified in railway.json
3. Build Docker image from [worker/Dockerfile](worker/Dockerfile) with Python, FFmpeg, and yt-dlp

The worker includes three config files:
- **railway.json** (ACTIVE) - Uses Dockerfile builder
- **railway.toml** (INACTIVE) - Alternative Nixpacks config (ignored when railway.json exists)
- **nixpacks.toml** (INACTIVE) - Nixpacks build plan (ignored when railway.json exists)

Railway prioritizes config files in this order: railway.json > railway.toml > nixpacks.toml

### 7. Verify Deployment

1. Check all three services show **"Active"** status
2. Click Next.js service for public URL
3. Check deployment logs:
   - Next.js: "Ready started server on 0.0.0.0:3000"
   - Worker: "worker_started" log message
   - Redis: Active status

## Configuration Reference

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_HOST` | Redis hostname | `${{Redis.REDISHOST}}` |
| `REDIS_PORT` | Redis port | `${{Redis.REDISPORT}}` |
| `REDIS_PASSWORD` | Redis password | `${{Redis.REDISPASSWORD}}` |
| `NEXT_PUBLIC_LOG_LABELS` | Logging config (Next.js) | `all` |
| `PORT` | Worker port | `3001` |

### Config Files

**Next.js Service** - [railway.toml](railway.toml):
```toml
[build]
builder = "nixpacks"

[build.nixpacksPlan]
phases = ["setup", "install", "build"]

[build.nixpacksPlan.phases.setup]
nixPkgs = ["nodejs_22"]

[build.nixpacksPlan.phases.install]
cmds = ["npm ci"]

[build.nixpacksPlan.phases.build]
cmds = ["npx prisma generate", "npm run build"]

[deploy]
startCommand = "npm start"
```

**Worker Service** - [worker/railway.json](worker/railway.json):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "worker/Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Watch Paths

- **Next.js**: `/,!worker/**` (watch root, ignore worker)
- **Worker**: `/worker/**` (watch worker only)

## Railway Best Practices

### Use Internal Networking

```env
# ✅ Correct - Internal networking
REDIS_HOST=${{Redis.REDISHOST}}

# ❌ Incorrect - Public internet (slower, costs more)
REDIS_HOST=redis-production-abcd.railway.app
```

### Config as Code Benefits

1. **Version Control**: Configuration tracked with code
2. **Priority**: Overrides dashboard settings
3. **Consistency**: Configuration matches code

**Important Notes:**
- Config files override dashboard settings
- Next.js service uses [railway.toml](railway.toml) at project root (Nixpacks with Node.js 22)
- Worker service uses [worker/railway.json](worker/railway.json) (Dockerfile builder)
- Railway looks for config files relative to the repository root, not the service root directory

### Automatic Deployments

When you push to your main branch:
1. Railway detects changes
2. Each service checks watch paths
3. Only services with matching changes rebuild

### Railway CLI

```bash
npm i -g @railway/cli
railway login
railway link
railway run npm run dev
```

CLI features:
- Run local code with production variables
- Link to specific services
- View logs and deployment status

## Verify Railway Dashboard Configuration

After pushing changes, verify these critical settings in the Railway dashboard:

### Next.js Service Settings

Navigate to Next.js service → **Settings** tab and verify:

1. **Root Directory**: Should be empty or `/`
2. **Watch Paths**: Should be `/,!worker/**`

If Watch Paths is empty or incorrect, the service won't redeploy when you push to main. Update it to `/,!worker/**` to watch the root directory while ignoring worker changes.

### Worker Service Settings

Navigate to Worker service → **Settings** tab and verify:

1. **Root Directory**: Should be `worker`
2. **Watch Paths**: Should be `/worker/**`

If these are incorrect, the worker may fail to build or redeploy unnecessarily.

### How to Update Settings

1. Click on the service in Railway dashboard
2. Go to **Settings** tab
3. Scroll to **Service** section
4. Update **Root Directory** and **Watch Paths** fields
5. Click outside the field to auto-save
6. Trigger a manual redeploy if needed

## Troubleshooting

### Next.js Service Not Redeploying

**Symptoms:**
- Push to main branch doesn't trigger deployment
- No build logs appear for Next.js service

**Solutions:**
1. Verify Watch Paths in Railway dashboard: `/,!worker/**`
2. Ensure Root Directory is `/` or empty
3. Check that [railway.toml](railway.toml) exists at project root
4. Trigger manual redeploy: Service → Deploy → Deploy latest commit
5. Check Railway activity feed for deployment triggers

### Worker Dockerfile Error

**Symptoms:**
- Error: "Dockerfile `Dockerfile` does not exist"
- Worker service fails to build

**Solutions:**
1. Verify [worker/railway.json](worker/railway.json) specifies `"dockerfilePath": "worker/Dockerfile"`
2. Ensure [worker/Dockerfile](worker/Dockerfile) exists
3. Check Root Directory is set to `worker` in Railway dashboard
4. Railway looks for Dockerfile paths relative to repository root, not service root

### Worker Not Processing Jobs

**Solutions:**
1. Verify Redis variables use reference syntax: `${{Redis.REDISHOST}}`
2. Check worker logs for connection errors
3. Ensure both services reference same Redis instance
4. Look for "worker_started" in logs

### Build Failures

**Next.js:**
1. Verify `build` and `start` scripts in package.json
2. Check all dependencies are listed
3. Review build logs

**Worker:**
1. Ensure [worker/Dockerfile](worker/Dockerfile) includes Python, FFmpeg, yt-dlp
2. Verify all files are copied in Dockerfile
3. Check [worker/railway.json](worker/railway.json) specifies `"dockerfilePath": "worker/Dockerfile"`
4. Alternative: Switch to Nixpacks by deleting railway.json (will use railway.toml instead)

### Both Services Deploying Every Push

**Solutions:**
1. Verify Root Directory:
   - Next.js: `/` or empty
   - Worker: `worker`
2. Check Watch Paths:
   - Next.js: `/,!worker/**`
   - Worker: `/worker/**`

### Database Connection Issues

**Solutions:**
1. Check `DATABASE_URL` format
2. External DB: Ensure Railway IPs are allowed
3. Railway DB: Use reference `${{Postgres.DATABASE_URL}}`
4. Verify Prisma generates client during build

### Environment Variables Not Working

**Solutions:**
1. Check reference syntax: `${{ServiceName.VARIABLE}}`
2. Next.js public vars must start with `NEXT_PUBLIC_`
3. Redeploy after changing variables
4. Service name is case-sensitive

### Dockerfile Not Being Used

**Solutions:**
1. Verify [worker/railway.json](worker/railway.json) exists and specifies `"builder": "DOCKERFILE"`
2. Check `"dockerfilePath": "worker/Dockerfile"` is set correctly
3. Ensure Dockerfile name is exactly `Dockerfile` (capital D)
4. Dockerfile must be in worker directory: [worker/Dockerfile](worker/Dockerfile)
5. Delete railway.json to switch to Nixpacks instead

### TypeScript Build Errors for Worker Code

**Problem:** Next.js build fails with "Cannot find module 'express'" when scanning worker directory

**Solution:**
Ensure [tsconfig.json](tsconfig.json) excludes the worker directory:
```json
{
  "exclude": ["node_modules", "worker"]
}
```

## Cost Optimization

Railway pricing:
- **Hobby Plan**: $5/month + usage
- **Pro Plan**: $20/month + usage
- Usage: CPU time, memory, network egress

**Optimization Tips:**

1. **Watch Paths**: Prevent unnecessary builds
2. **Internal Networking**: Avoid egress charges (use `${{}}` syntax)
3. **Monitor Dashboard**: Track per-service costs
4. **Optimize Docker**: Multi-stage builds, smaller images
5. **Restart Policies**: Prevent infinite loops (already configured)

## Scaling

### Web Service
- Horizontal scaling on Pro plan
- Automatic load balancing

### Worker Service

**Vertical Scaling:**
- Increase memory in settings
- Adjust worker concurrency in code

**Horizontal Scaling (Pro plan):**
- Increase replicas in settings
- BullMQ distributes jobs across workers
- Each replica processes from shared queue

**Monitor:**
- Watch Redis queue size
- Add replicas if queue grows
- Reduce if queue empty

Configuration: Adjust concurrency in [worker/src/worker.ts](worker/src/worker.ts)
