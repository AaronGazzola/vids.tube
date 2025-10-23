# Deployment Guide

This guide walks through deploying the vids.tube application. You'll set up four services: PostgreSQL database, Redis, Cloudflare R2 storage, a Worker service, and the Next.js web app.

## 1. Create PostgreSQL Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up
2. Click **Create Project**
3. Give it a name (e.g., "vids-tube")
4. Select a region close to your users
5. Click **Create Project**
6. Copy the **Connection String** (starts with `postgresql://...`)
   - Save this as `DATABASE_URL` - you'll need it for both Worker and Next.js

## 2. Setup Cloudflare R2 Storage

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and log in
2. Click **R2 Object Storage** in the sidebar
3. Click **Create bucket**
   - Name: `vids-tube-videos` (or your choice)
   - Location: Automatic
   - Click **Create bucket**
4. Click **Manage R2 API Tokens**
5. Click **Create API Token**
   - Name: `vids-tube-worker`
   - Permissions: **Object Read & Write**
   - Select your bucket
   - Click **Create API Token**
6. Copy and save these three values:
   - **Access Key ID** → Save as `R2_ACCESS_KEY_ID`
   - **Secret Access Key** → Save as `R2_SECRET_ACCESS_KEY`
   - **Account ID** (shown at top of R2 page) → Save as `R2_ACCOUNT_ID`
7. Go back to your bucket → **Settings** → **Public Access**
   - Toggle **Public Development URL** to enable
   - Copy the **Public Development URL** (looks like `pub-xxxxx.r2.dev`)
   - Save as `R2_PUBLIC_DOMAIN` (just the domain, no https://)
8. Save your bucket name as `R2_BUCKET` (e.g., `vids-tube-videos`)

## 3. Setup Redis Database (Railway)

1. Go to [railway.app](https://railway.app) and sign up
2. Click **New Project** → **Provision Redis**
3. Click on the Redis service
4. Click **Variables** tab
5. Copy these three values:
   - `REDISHOST` → Save as `REDIS_HOST`
   - `REDISPORT` → Save as `REDIS_PORT`
   - `REDISPASSWORD` → Save as `REDIS_PASSWORD`

## 4. Deploy Worker Service (Railway)

1. In the same Railway project, click **New** → **GitHub Repo**
2. Connect your GitHub account and select your repository
3. Click on the new service that was created
4. Click **Settings** tab:
   - **Root Directory**: Set to `worker`
   - **Watch Paths**: Set to `worker/**`
5. Click **Variables** tab and add these variables:
   - `DATABASE_URL` (from step 1)
   - `REDIS_HOST` (from step 3)
   - `REDIS_PORT` (from step 3)
   - `REDIS_PASSWORD` (from step 3)
   - `R2_ACCOUNT_ID` (from step 2)
   - `R2_ACCESS_KEY_ID` (from step 2)
   - `R2_SECRET_ACCESS_KEY` (from step 2)
   - `R2_BUCKET` (from step 2)
   - `R2_PUBLIC_DOMAIN` (from step 2)
   - `PORT` = `3001`
6. Click **Settings** tab → Enable **Generate Domain** to get a public URL
7. Copy the public URL (e.g., `https://worker-production-xxxx.up.railway.app`)
   - Save as `WORKER_URL` - you'll need this for Next.js

## 5. Deploy Next.js Web App (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: Leave as `.` (root)
   - **Build Command**: Leave default (`next build`)
   - **Output Directory**: Leave default (`.next`)
5. Click **Environment Variables** and add these:
   - `DATABASE_URL` (from step 1)
   - `REDIS_HOST` (from step 3)
   - `REDIS_PORT` (from step 3)
   - `REDIS_PASSWORD` (from step 3)
   - `WORKER_URL` (from step 4)
   - `R2_ACCOUNT_ID` (from step 2)
   - `R2_ACCESS_KEY_ID` (from step 2)
   - `R2_SECRET_ACCESS_KEY` (from step 2)
   - `R2_BUCKET` (from step 2)
   - `R2_PUBLIC_DOMAIN` (from step 2)
   - `NEXT_PUBLIC_LOG_LABELS` = `all` (optional, for debugging)
6. Click **Deploy**

## 6. Initialize Database

After both services are deployed:

1. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
   Or run this in Railway worker service terminal, or locally with `DATABASE_URL` set

## Verify Deployment

### Check Worker:
Visit `https://your-worker-url.railway.app/health`

Should return: `{"status":"ok"}`

### Check Next.js:
Visit your Vercel URL and try creating a project

## Environment Variables Summary

### Next.js (Vercel) needs:
- `DATABASE_URL` - from Neon
- `REDIS_HOST` - from Railway Redis
- `REDIS_PORT` - from Railway Redis
- `REDIS_PASSWORD` - from Railway Redis
- `WORKER_URL` - from Railway Worker (public domain)
- `R2_ACCOUNT_ID` - from Cloudflare R2
- `R2_ACCESS_KEY_ID` - from Cloudflare R2
- `R2_SECRET_ACCESS_KEY` - from Cloudflare R2
- `R2_BUCKET` - from Cloudflare R2
- `R2_PUBLIC_DOMAIN` - from Cloudflare R2
- `NEXT_PUBLIC_LOG_LABELS` - optional

### Worker (Railway) needs:
- `DATABASE_URL` - from Neon
- `REDIS_HOST` - from Railway Redis
- `REDIS_PORT` - from Railway Redis
- `REDIS_PASSWORD` - from Railway Redis
- `R2_ACCOUNT_ID` - from Cloudflare R2
- `R2_ACCESS_KEY_ID` - from Cloudflare R2
- `R2_SECRET_ACCESS_KEY` - from Cloudflare R2
- `R2_BUCKET` - from Cloudflare R2
- `R2_PUBLIC_DOMAIN` - from Cloudflare R2
- `PORT` - set to `3001`

## Troubleshooting

### Worker deployment fails
- Check that **Root Directory** is set to `worker`
- Check that **Watch Paths** is set to `worker/**`
- View logs in Railway dashboard

### Redis connection fails from Vercel
- Make sure you're using the Railway Redis TCP proxy values (not internal network)
- Check that `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` are correct

### Database connection fails
- Verify `DATABASE_URL` is correctly formatted
- Check that the database is accessible from both Railway and Vercel
- Neon databases are publicly accessible by default

### Worker can't be reached from Next.js
- Check that Railway Worker has **Generate Domain** enabled
- Verify `WORKER_URL` in Vercel includes `https://` and the full domain
- Check Railway Worker logs for startup errors
