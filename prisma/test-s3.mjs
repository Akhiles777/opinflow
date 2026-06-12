#!/usr/bin/env node
// Usage: docker compose exec app node prisma/test-s3.mjs
import https from "https";
import crypto from "crypto";

function strip(s) {
  return (s ?? "").replace(/^["']|["']$/g, "").trim();
}

const ak = strip(process.env.S3_ACCESS_KEY);
const sk = strip(process.env.S3_SECRET_KEY);
const bucket = strip(process.env.S3_BUCKET) || "opinflow-media";
const host = "s3.regru.cloud";

if (!ak || !sk) {
  console.error("S3_ACCESS_KEY or S3_SECRET_KEY is not set");
  process.exit(1);
}

console.log(`AK: ${ak.slice(0, 4)}... (${ak.length} chars)`);
console.log(`SK length: ${sk.length}`);
console.log(`Bucket: ${bucket}`);
console.log("");

async function testPut(region, useUnsigned) {
  const body = Buffer.from("ping");
  const payloadHash = useUnsigned
    ? "UNSIGNED-PAYLOAD"
    : crypto.createHash("sha256").update(body).digest("hex");

  const now = new Date();
  const ts = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const ds = ts.slice(0, 8);
  const path = `/${bucket}/_diag-test.txt`;
  const sh = "host;x-amz-content-sha256;x-amz-date";
  const ch =
    `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${ts}\n`;
  const cr = `PUT\n${path}\n\n${ch}${sh}\n${payloadHash}`;
  const cs = `${ds}/${region}/s3/aws4_request`;
  const crHash = crypto.createHash("sha256").update(cr).digest("hex");
  const sts = `AWS4-HMAC-SHA256\n${ts}\n${cs}\n${crHash}`;
  const f = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
  const sigKey = f(f(f(f("AWS4" + sk, ds), region), "s3"), "aws4_request");
  const sig = crypto
    .createHmac("sha256", sigKey)
    .update(sts)
    .digest("hex");
  const auth = `AWS4-HMAC-SHA256 Credential=${ak}/${cs}, SignedHeaders=${sh}, Signature=${sig}`;

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: host,
        path,
        method: "PUT",
        headers: {
          Authorization: auth,
          Host: host,
          "x-amz-content-sha256": payloadHash,
          "x-amz-date": ts,
          "Content-Length": body.length,
          "Content-Type": "text/plain",
        },
      },
      (res) => {
        let d = "";
        res.on("data", (x) => (d += x));
        res.on("end", () => resolve({ status: res.statusCode, body: d }));
      },
    );
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.write(body);
    req.end();
  });
}

const combos = [
  { region: "us-east-1", unsigned: true },
  { region: "us-east-1", unsigned: false },
  { region: "default", unsigned: true },
  { region: "default", unsigned: false },
  { region: "ru-1", unsigned: true },
  { region: "ru-1", unsigned: false },
];

for (const { region, unsigned } of combos) {
  const label = `region=${region.padEnd(10)} ${unsigned ? "UNSIGNED-PAYLOAD" : "SIGNED-PAYLOAD  "}`;
  const r = await testPut(region, unsigned);
  const bodyPreview = r.body.replace(/\s+/g, " ").slice(0, 300);
  console.log(`${label} → HTTP ${r.status} | ${bodyPreview}`);
  if (r.status === 200) {
    console.log("\n✓ SUCCESS with this combination!");
    break;
  }
}
