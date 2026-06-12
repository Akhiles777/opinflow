import { createHmac } from "crypto";
import { request as nodeRequest } from "https";

export const S3_BUCKET = process.env.S3_BUCKET ?? "opinflow-media";
export const S3_ENDPOINT = process.env.S3_ENDPOINT ?? "https://s3.regru.cloud";

export function isS3Configured(): boolean {
  return Boolean(process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

function strip(s: string): string {
  return (s ?? "").replace(/^["']|["']$/g, "").trim();
}

function getCfg() {
  const endpoint = strip(process.env.S3_ENDPOINT ?? S3_ENDPOINT);
  const host = new URL(endpoint).hostname;
  return {
    ak: strip(process.env.S3_ACCESS_KEY ?? ""),
    sk: strip(process.env.S3_SECRET_KEY ?? ""),
    bucket: strip(process.env.S3_BUCKET ?? S3_BUCKET),
    endpoint,
    host,
  };
}

// Reg.ru Ceph RadosGW requires SigV2 (HMAC-SHA1). SigV4 returns 403 for all
// regions because their RadosGW build only supports the legacy signing protocol.
function authV2(sk: string, ak: string, method: string, contentType: string, resource: string) {
  const date = new Date().toUTCString();
  const sts = `${method}\n\n${contentType}\n${date}\n${resource}`;
  const sig = createHmac("sha1", sk).update(sts).digest("base64");
  return { Date: date, Authorization: `AWS ${ak}:${sig}` };
}

function httpsRaw(
  host: string,
  path: string,
  method: string,
  headers: Record<string, string | number>,
  body?: Buffer,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = nodeRequest({ hostname: host, path, method, headers }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: d }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function uploadToS3(file: Buffer, key: string, contentType: string): Promise<string> {
  const { ak, sk, bucket, endpoint, host } = getCfg();
  const resource = `/${bucket}/${key}`;
  const auth = authV2(sk, ak, "PUT", contentType, resource);

  const res = await httpsRaw(host, resource, "PUT", {
    ...auth,
    Host: host,
    "Content-Type": contentType,
    "Content-Length": file.length,
  }, file);

  if (res.status !== 200) {
    throw new Error(`S3 PUT failed: HTTP ${res.status} — ${res.body.slice(0, 300)}`);
  }

  return `${endpoint}/${bucket}/${key}`;
}

export async function deleteFromS3(key: string): Promise<void> {
  const { ak, sk, bucket, host } = getCfg();
  const resource = `/${bucket}/${key}`;
  const auth = authV2(sk, ak, "DELETE", "", resource);

  const res = await httpsRaw(host, resource, "DELETE", {
    ...auth,
    Host: host,
    "Content-Length": 0,
  });

  if (res.status !== 204 && res.status !== 200 && res.status !== 404) {
    throw new Error(`S3 DELETE failed: HTTP ${res.status} — ${res.body.slice(0, 300)}`);
  }
}

// SigV2 presigned GET URL for private objects
export async function getSignedS3Url(key: string, expiresIn = 3600): Promise<string> {
  const { ak, sk, bucket, host } = getCfg();
  const resource = `/${bucket}/${key}`;
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  const sts = `GET\n\n\n${expires}\n${resource}`;
  const sig = createHmac("sha1", sk).update(sts).digest("base64");
  const params = new URLSearchParams({ AWSAccessKeyId: ak, Expires: String(expires), Signature: sig });
  return `https://${host}${resource}?${params}`;
}
