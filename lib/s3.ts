import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const S3_BUCKET = process.env.S3_BUCKET ?? "opinflow-media";
export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "https://s3.regru.cloud";

export function isS3Configured(): boolean {
  return Boolean(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

// Lazy factory — credentials always read from process.env at call time,
// avoiding stale empty values that occur with module-level initialization.
function getS3Client(): S3Client {
  return new S3Client({
    region: "ru-1",
    endpoint: process.env.S3_ENDPOINT ?? "https://s3.regru.cloud",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
    forcePathStyle: true,
  });
}

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const bucket = process.env.S3_BUCKET ?? S3_BUCKET;
  const endpoint = process.env.S3_ENDPOINT ?? S3_ENDPOINT;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: "public-read",
    }),
  );

  return `${endpoint}/${bucket}/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET ?? S3_BUCKET,
      Key: key,
    }),
  );
}

export async function getSignedS3Url(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET ?? S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}
