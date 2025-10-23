import ytDlpWrap from "yt-dlp-exec";

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
        error: error instanceof Error ? error.message : String(error)
      }));

      if (attempt >= maxRetries) {
        throw error;
      }
    }
  }

  throw lastError;
}
