import { promises as fs } from "fs";
import path from "path";

export async function setupCookies(): Promise<void> {
  const cookiesContent = process.env.YT_COOKIES_CONTENT;
  const cookiesPath = process.env.YT_COOKIES_PATH || "/app/cookies/cookies.txt";

  if (cookiesContent) {
    try {
      const cookiesDir = path.dirname(cookiesPath);
      await fs.mkdir(cookiesDir, { recursive: true });

      const decodedContent = Buffer.from(cookiesContent, "base64").toString("utf-8");
      await fs.writeFile(cookiesPath, decodedContent);

      const stats = await fs.stat(cookiesPath);
      console.log(JSON.stringify({
        action: "cookies_setup",
        status: "success",
        path: cookiesPath,
        size: stats.size,
        source: "environment_variable"
      }));
    } catch (error) {
      console.log(JSON.stringify({
        action: "cookies_setup",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error"
      }));
    }
  } else {
    try {
      const exists = await fs.access(cookiesPath).then(() => true).catch(() => false);
      console.log(JSON.stringify({
        action: "cookies_check",
        path: cookiesPath,
        exists,
        source: "file_system"
      }));
    } catch (error) {
      console.log(JSON.stringify({
        action: "cookies_check",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error"
      }));
    }
  }
}