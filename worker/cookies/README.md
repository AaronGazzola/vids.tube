# YouTube Cookies Setup

Some YouTube videos are DRM-protected or require authentication to download. To download these videos, you need to provide valid YouTube cookies from a logged-in browser session.

## Quick Setup (macOS)

### Option 1: Using Browser Extension (Recommended - Most Reliable)

1. Install the [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) Chrome extension
2. Go to [youtube.com](https://youtube.com) and make sure you're logged in
3. Click the extension icon and select "Export"
4. Save the file as `cookies.txt` in this directory (`worker/cookies/cookies.txt`)

**This is the most reliable method** as it extracts all cookies including authentication tokens without requiring system permissions.

### Option 2: Using yt-dlp with Safari (Easiest for macOS)

Safari stores cookies in a way that yt-dlp can access without keychain permissions:

```bash
yt-dlp --cookies-from-browser safari --cookies worker/cookies/cookies.txt --skip-download https://www.youtube.com
```

### Option 3: Using yt-dlp with Chrome (Requires Keychain Access)

```bash
yt-dlp --cookies-from-browser chrome --cookies worker/cookies/cookies.txt --skip-download https://www.youtube.com
```

**Note:** Chrome on macOS may require you to grant yt-dlp/Python access to Keychain. You'll see a system prompt asking for permission.

## Verify Cookies

Test your cookies with:

```bash
yt-dlp --cookies worker/cookies/cookies.txt -F "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

If successful, you should see a list of available formats without any DRM errors.

## Production Deployment (Railway)

For Railway deployment:

1. Extract cookies locally using one of the methods above
2. Create a Railway environment variable:
   ```bash
   railway variables set YT_COOKIES_PATH=/app/cookies/cookies.txt
   ```
3. Add the cookies file to your repository (ensure it's not in `.gitignore`)
4. The Dockerfile will copy the cookies file to the container

**Security Note:** Cookies contain authentication tokens. Never commit cookies to public repositories.

## Troubleshooting

### "This video is drm protected"
- Your cookies are missing or expired
- Extract fresh cookies from a logged-in browser session
- Make sure you're logged in to YouTube in the browser you're extracting from

### "Extracted 0 cookies (X could not be decrypted)"
- This is a macOS Keychain permission issue with Chrome/Edge/Firefox
- Use Safari (option 2) or the browser extension (option 1) instead
- Or grant Python/yt-dlp access in System Settings → Privacy & Security → Full Disk Access

### "Video format not available"
- The video may be private, age-restricted, or region-locked
- Try accessing the video in your browser first to ensure it's accessible
