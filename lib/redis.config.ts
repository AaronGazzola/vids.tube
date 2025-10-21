import type { RedisOptions } from "bullmq";

function getRedisUrl(): string | undefined {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
    const auth = process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : '';
    return `redis://${auth}${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
  }

  if (process.env.REDISHOST && process.env.REDISPORT) {
    const auth = process.env.REDISPASSWORD ? `:${process.env.REDISPASSWORD}@` : '';
    return `redis://${auth}${process.env.REDISHOST}:${process.env.REDISPORT}`;
  }

  return undefined;
}

export function getRedisConnection(): RedisOptions {
  const redisUrl = getRedisUrl();

  if (redisUrl) {
    console.log(JSON.stringify({
      action: "redis_config",
      usingUrl: true,
      urlPrefix: redisUrl.substring(0, 15) + "..."
    }));

    try {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || "6379"),
        password: url.password || undefined,
        username: url.username || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.log(JSON.stringify({
            action: "redis_retry",
            attempt: times,
            delay
          }));
          return delay;
        }
      };
    } catch (error) {
      console.log(JSON.stringify({
        action: "redis_url_parse_error",
        error: error instanceof Error ? error.message : "Unknown error"
      }));
    }
  }

  const config: RedisOptions = {
    host: process.env.REDIS_HOST || process.env.REDISHOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || process.env.REDISPORT || "6379"),
    password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      console.log(JSON.stringify({
        action: "redis_retry",
        attempt: times,
        delay
      }));
      return delay;
    }
  };

  console.log(JSON.stringify({
    action: "redis_config",
    host: config.host,
    port: config.port,
    hasPassword: !!config.password
  }));

  return config;
}