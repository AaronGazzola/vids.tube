export enum LOG_LABELS {
  GENERATE = "generate",
  API = "api",
  AUTH = "auth",
  DB = "db",
  FETCH = "fetch",
  RATE_LIMIT = "rate-limit",
  IMAGE = "image",
  WIDGET = "widget",
  VIDEO = "video",
  VIDEO_PROCESSING = "video-processing",
  VIDEO_DOWNLOAD = "video-download",
  API_PROCESS = "api-process",
  API_STATUS = "api-status",
}

interface ConditionalLogOptions {
  maxStringLength?: number;
  label: LOG_LABELS | string;
}

export function conditionalLog(
  data: unknown,
  options: ConditionalLogOptions
): string | null {
  const { maxStringLength = 200, label } = options;

  const logLabels = process.env.NEXT_PUBLIC_LOG_LABELS;

  if (!logLabels || logLabels === "none") {
    return null;
  }

  if (logLabels !== "all") {
    const allowedLabels = logLabels.split(",").map((l) => l.trim());
    if (!allowedLabels.includes(label)) {
      return null;
    }
  }

  try {
    const processedData = deepStringify(data, maxStringLength, new WeakSet());
    const result = JSON.stringify(processedData);
    return result.replace(/\s+/g, "");
  } catch {
    return JSON.stringify({ error: "Failed to stringify data", label });
  }
}

function deepStringify(
  value: unknown,
  maxLength: number,
  seen: WeakSet<object>
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value, maxLength);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message, maxLength),
      stack: value.stack ? truncateString(value.stack, maxLength) : undefined,
    };
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular Reference]";
    }

    seen.add(value);

    if (Array.isArray(value)) {
      const result = value.map((item) => deepStringify(item, maxLength, seen));
      seen.delete(value);
      return result;
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = deepStringify(val, maxLength, seen);
    }
    seen.delete(value);
    return result;
  }

  return String(value);
}

function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }

  const startLength = Math.floor((maxLength - 3) / 2);
  const endLength = maxLength - 3 - startLength;

  return str.slice(0, startLength) + "..." + str.slice(-endLength);
}
