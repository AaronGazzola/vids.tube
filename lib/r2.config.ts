import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  R2DeleteOptions,
  R2DownloadOptions,
  R2UploadOptions,
  R2UploadResult,
} from "./r2.types";

export function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadToR2(
  options: R2UploadOptions
): Promise<R2UploadResult> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType,
    ContentLength: options.contentLength,
  });

  await client.send(command);

  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  const url = publicDomain
    ? `https://${publicDomain}/${options.key}`
    : `https://${options.bucket}.r2.cloudflarestorage.com/${options.key}`;

  return {
    url,
    key: options.key,
    bucket: options.bucket,
  };
}

export async function downloadFromR2(
  options: R2DownloadOptions
): Promise<ReadableStream> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error("No body in R2 response");
  }

  return response.Body.transformToWebStream();
}

export async function deleteFromR2(options: R2DeleteOptions): Promise<void> {
  const client = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
  });

  await client.send(command);
}
