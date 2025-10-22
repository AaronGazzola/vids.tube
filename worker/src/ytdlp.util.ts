import ytDlpWrap from "yt-dlp-exec";
import { promises as fs } from "fs";
import path from "path";

const COOKIE_REFRESH_COOLDOWN = 60000;
let lastCookieRefreshAttempt = 0;

export function isBotDetectionError(error: unknown): boolean {
  const errorStr = String(error);
  const stderr = (error as { stderr?: string }).stderr || "";

  return (
    errorStr.includes("Sign in to confirm you're not a bot") ||
    errorStr.includes("Sign in required") ||
    stderr.includes("Sign in to confirm you're not a bot") ||
    stderr.includes("Sign in required")
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function downloadWithRetry(
  url: string,
  options: Record<string, unknown>,
  maxRetries = 3
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(JSON.stringify({
        action: "ytdlp_download_attempt",
        attempt,
        maxRetries,
        url
      }));

      if (attempt > 1) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(JSON.stringify({
          action: "ytdlp_retry_backoff",
          attempt,
          backoffMs
        }));
        await sleep(backoffMs);
      }

      await ytDlpWrap(url, options);

      console.log(JSON.stringify({
        action: "ytdlp_download_success",
        attempt
      }));

      return;

    } catch (error) {
      lastError = error;

      console.log(JSON.stringify({
        action: "ytdlp_download_error",
        attempt,
        error: error instanceof Error ? error.message : String(error),
        isBotDetection: isBotDetectionError(error)
      }));

      if (isBotDetectionError(error)) {
        const now = Date.now();
        if (now - lastCookieRefreshAttempt > COOKIE_REFRESH_COOLDOWN) {
          console.log(JSON.stringify({
            action: "bot_detection_triggered",
            attempt,
            message: "YouTube bot detection triggered. Cookie refresh needed."
          }));
          lastCookieRefreshAttempt = now;
        }

        if (attempt < maxRetries) {
          continue;
        }
      }

      if (attempt >= maxRetries) {
        throw error;
      }
    }
  }

  throw lastError;
}

export async function addRateLimitDelay(minDelayMs = 5000, maxDelayMs = 10000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;

  console.log(JSON.stringify({
    action: "rate_limit_delay",
    delayMs: delay
  }));

  await sleep(delay);
}

export async function verifyCookieFile(cookiePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(cookiePath);
    if (!stats.isFile() || stats.size === 0) {
      console.log(JSON.stringify({
        action: "cookie_file_invalid",
        cookiePath,
        exists: stats.isFile(),
        size: stats.size
      }));
      return false;
    }

    const content = await fs.readFile(cookiePath, "utf-8");
    const hasYouTubeCookies = content.includes("youtube.com") || content.includes(".youtube.com");

    console.log(JSON.stringify({
      action: "cookie_file_verified",
      cookiePath,
      size: stats.size,
      hasYouTubeCookies

    }));

    return hasYouTubeCookies;
  } catch (error) {
    console.log(JSON.stringify({
      action: "cookie_file_check_failed",
      cookiePath,
      error: error instanceof Error ? error.message : String(error)
    }));
    return false;
  }
}
