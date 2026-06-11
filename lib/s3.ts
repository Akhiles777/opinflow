import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3 = new S3Client({
  region: "ru-1",
  endpoint: process.env.S3_ENDPOINT ?? "https://s3.regru.cloud",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
  forcePathStyle: true,
});

export const S3_BUCKET = process.env.S3_BUCKET ?? "opinflow-media";
export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "https://s3.regru.cloud";

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
  }));
  return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  }));
}

export async function getSignedS3Url(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}
