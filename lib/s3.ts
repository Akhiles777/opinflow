import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const S3_BUCKET = process.env.S3_BUCKET ?? "opinflow-media";
export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "https://s3.regru.cloud";

export function isS3Configured(): boolean {
  return Boolean(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

function strip(s: string) {
  return s.replace(/^["']|["']$/g, "").trim();
}

// Lazy factory — credentials always read from process.env at call time.
function getS3Client(): S3Client {
  const client = new S3Client({
    region: "us-east-1",
    endpoint: strip(process.env.S3_ENDPOINT ?? "https://s3.regru.cloud"),
    credentials: {
      accessKeyId: strip(process.env.S3_ACCESS_KEY ?? ""),
      secretAccessKey: strip(process.env.S3_SECRET_KEY ?? ""),
    },
    forcePathStyle: true,
  });

  // Reg.ru Ceph RadosGW rejects signed payload hashes — use UNSIGNED-PAYLOAD.
  // Skip HEAD requests: Ceph returns an empty body for HEAD errors and the
  // SDK throws UnknownError when it can't parse them.
  client.middlewareStack.add(
    (next) => (args) => {
      const req = args.request as { method?: string; headers: Record<string, string> };
      if (req.method !== "HEAD") {
        req.headers["x-amz-content-sha256"] = "UNSIGNED-PAYLOAD";
      }
      return next(args);
    },
    { step: "build", name: "unsignedPayload" },
  );

  return client;
}

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  const bucket = strip(process.env.S3_BUCKET ?? S3_BUCKET);
  const endpoint = strip(process.env.S3_ENDPOINT ?? S3_ENDPOINT);

  // No ACL — Reg.ru S3 returns non-standard errors for ACL operations.
  // Set the bucket policy to public-read in the Reg.ru S3 control panel.
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  );

  return `${endpoint}/${bucket}/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: strip(process.env.S3_BUCKET ?? S3_BUCKET),
      Key: key,
    }),
  );
}

export async function getSignedS3Url(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: strip(process.env.S3_BUCKET ?? S3_BUCKET),
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}
