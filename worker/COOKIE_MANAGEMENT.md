# Cookie Management Guide

## Overview

The worker uses YouTube cookies to bypass bot detection when downloading videos. This guide explains how to manage cookies for both local development and Railway deployment.

## Why Cookies Are Needed

YouTube implements bot detection that blocks automated video downloads from cloud/datacenter IPs. Authenticated cookies help bypass these restrictions, though they are not 100% reliable on datacenter IPs.

## Local Development

### Refresh Cookies

```bash
./worker/scripts/update-cookies.sh
```

This script:
- Attempts to extract cookies from Chrome, Firefox, Safari, and Edge
- Saves cookies to `worker/cookies/cookies.txt`
- Verifies cookies work by testing a download

### Environment Variables

Create `.env.local` in the worker directory:

```env
YT_COOKIES_PATH=/Users/yourusername/Documents/Projects/vids.tube/worker/cookies/cookies.txt
YT_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
```

## Railway Deployment

### Initial Setup

1. Refresh your local cookies:
   ```bash
   ./worker/scripts/update-cookies.sh
   ```

2. Deploy cookies to Railway:
   ```bash
   ./worker/scripts/deploy-cookies.sh
   ```

3. Set the cookies path in Railway:
   ```bash
   railway variables --set YT_COOKIES_PATH=/app/cookies/cookies.txt
   ```

### How It Works

1. `deploy-cookies.sh` reads your local cookie file and base64-encodes it
2. Sets the `YT_COOKIES_CONTENT` environment variable in Railway
3. On worker startup, `startup.ts` decodes the environment variable
4. Writes the decoded cookies to `/app/cookies/cookies.txt`
5. The processor uses this file for all yt-dlp downloads

### Refresh Cookies on Railway

When you encounter bot detection errors:

1. Refresh local cookies:
   ```bash
   ./worker/scripts/update-cookies.sh
   ```

2. Redeploy to Railway:
   ```bash
   ./worker/scripts/deploy-cookies.sh
   ```

3. Restart the Railway worker service

## Automatic Retry Logic

The worker automatically handles cookie issues:

### Bot Detection
- Detects "Sign in to confirm you're not a bot" errors
- Retries download with exponential backoff (1s, 2s, 4s)
- Maximum 3 retry attempts per download

### Rate Limiting
- Adds 5-10 second random delay between section downloads
- Helps avoid triggering YouTube's rate limits
- Recommended limit: ~300 videos/hour

### Error Messages

**Bot Detection Error:**
```
YouTube bot detection triggered. Please refresh cookies and try again.
This typically happens when downloading from cloud servers.
Consider using a residential proxy or reducing download frequency.
```

**Cookie Warning:**
```
Cookie file may be invalid or missing YouTube cookies
```

## Troubleshooting

### Cookies Keep Expiring

**Problem:** YouTube rotates cookies frequently, especially on datacenter IPs

**Solutions:**
1. Refresh cookies more frequently (daily)
2. Use a throwaway YouTube account (not your personal account)
3. Consider implementing residential proxies (Option 1 from architecture docs)

### Bot Detection Still Occurs

**Problem:** Railway uses datacenter IPs which YouTube aggressively blocks

**Short-term:**
- Refresh cookies immediately when error occurs
- Reduce download frequency
- Add user-agent spoofing

**Long-term:**
- Implement residential proxy integration (most reliable)
- Use proxy fallback on bot detection errors

### Cookie Extraction Fails

**Problem:** Browser cookies can't be extracted

**Solutions:**
1. Ensure you're logged into YouTube in your browser
2. Try a different browser (Chrome, Safari, Firefox)
3. Close the browser and try again
4. Manually export cookies using browser extension

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `YT_COOKIES_PATH` | Yes | `/app/cookies/cookies.txt` | Path to cookies file |
| `YT_COOKIES_CONTENT` | Railway Only | - | Base64-encoded cookie content |
| `YT_USER_AGENT` | No | yt-dlp default | Browser user-agent string |

## Best Practices

1. **Use a separate account:** Create a throwaway YouTube account for the worker
2. **Monitor logs:** Watch for cookie warnings and bot detection errors
3. **Refresh proactively:** Don't wait for failures - refresh cookies regularly
4. **Rate limit:** Keep download frequency under 300 videos/hour
5. **Plan for failures:** Bot detection will happen - have a retry strategy
6. **Consider proxies:** For production use, residential proxies are recommended

## Security Notes

- Never commit `cookies.txt` to git (already in `.gitignore`)
- Cookies contain authentication tokens - treat as secrets
- Use Railway's secret management for `YT_COOKIES_CONTENT`
- Rotate cookies regularly
- Don't share cookies across different services/IPs
