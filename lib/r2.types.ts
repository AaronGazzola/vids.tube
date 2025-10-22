export interface R2UploadOptions {
  bucket: string;
  key: string;
  body: Buffer | ReadableStream;
  contentType?: string;
  contentLength?: number;
}

export interface R2DownloadOptions {
  bucket: string;
  key: string;
}

export interface R2DeleteOptions {
  bucket: string;
  key: string;
}

export interface R2UploadResult {
  url: string;
  key: string;
  bucket: string;
}
