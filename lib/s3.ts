import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const S3_BUCKET = process.env.S3_BUCKET ?? "opinflow-media";
export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "https://s3.regru.cloud";

export function isS3Configured(): boolean {
  return Boolean(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

// Lazy factory — credentials always read from process.env at call time.
function getS3Client(): S3Client {
  return new S3Client({
    region: "ru-1",
    endpoint: process.env.S3_ENDPOINT ?? "https://s3.regru.cloud",
    credentials: {
      accessKeyId: (process.env.S3_ACCESS_KEY ?? "").replace(/^["']|["']$/g, "").trim(),
      secretAccessKey: (process.env.S3_SECRET_KEY ?? "").replace(/^["']|["']$/g, "").trim(),
    },
    forcePathStyle: true,
  });
}

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const bucket = (process.env.S3_BUCKET ?? S3_BUCKET).replace(/^["']|["']$/g, "").trim();
  const endpoint = (process.env.S3_ENDPOINT ?? S3_ENDPOINT).replace(/^["']|["']$/g, "").trim();
  const client = getS3Client();

  try {
    // Try with public-read ACL so the URL is directly accessible
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: "public-read",
    }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isAclError =
      msg.includes("InvalidArgument") ||
      msg.includes("NotImplemented") ||
      msg.includes("AccessControlListNotSupported") ||
      msg.includes("BucketPublicAccessBlocked") ||
      msg.toLowerCase().includes("acl");

    if (isAclError) {
      // S3 provider doesn't support object ACLs — upload without it.
      // Make sure the bucket itself has a public-read policy on the provider side.
      console.warn("[s3] ACL not supported by provider, uploading without ACL:", msg);
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      }));
    } else {
      console.error("[s3] Upload failed:", msg);
      throw err;
    }
  }

  return `${endpoint}/${bucket}/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: (process.env.S3_BUCKET ?? S3_BUCKET).replace(/^["']|["']$/g, "").trim(),
      Key: key,
    }),
  );
}

export async function getSignedS3Url(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: (process.env.S3_BUCKET ?? S3_BUCKET).replace(/^["']|["']$/g, "").trim(),
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}
