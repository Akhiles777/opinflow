#!/usr/bin/env node
// Usage: docker compose exec app node prisma/test-s3.mjs
import https from "https";
import crypto from "crypto";
import dns from "dns/promises";

function strip(s) {
  return (s ?? "").replace(/^["']|["']$/g, "").trim();
}

const ak = strip(process.env.S3_ACCESS_KEY);
const sk = strip(process.env.S3_SECRET_KEY);
const bucket = strip(process.env.S3_BUCKET) || "opinflow-media";

if (!ak || !sk) { console.error("S3_ACCESS_KEY or S3_SECRET_KEY is not set"); process.exit(1); }

console.log(`AK: ${ak.slice(0, 4)}... (${ak.length} chars)`);
console.log(`SK: ${sk.slice(0, 4)}... (${sk.length} chars)`);
console.log(`Bucket: ${bucket}\n`);

// ─── SigV4 PUT ────────────────────────────────────────────────────────────────
async function testV4(opts) {
  const { region, unsigned, signCT, host = "s3.regru.cloud", pathStyle = true } = opts;
  const contentType = "text/plain";
  const body = Buffer.from("ping");
  const payloadHash = unsigned
    ? "UNSIGNED-PAYLOAD"
    : crypto.createHash("sha256").update(body).digest("hex");

  const now = new Date();
  const ts = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const ds = ts.slice(0, 8);
  const reqPath = pathStyle ? `/${bucket}/_diag-test.txt` : `/_diag-test.txt`;

  const headers = { host, "x-amz-content-sha256": payloadHash, "x-amz-date": ts };
  if (signCT) headers["content-type"] = contentType;

  // canonical headers must be sorted alphabetically
  const sortedKeys = Object.keys(headers).sort();
  const sh = sortedKeys.join(";");
  const ch = sortedKeys.map((k) => `${k}:${headers[k]}`).join("\n") + "\n";

  const cr = `PUT\n${reqPath}\n\n${ch}${sh}\n${payloadHash}`;
  const cs = `${ds}/${region}/s3/aws4_request`;
  const crHash = crypto.createHash("sha256").update(cr).digest("hex");
  const sts = `AWS4-HMAC-SHA256\n${ts}\n${cs}\n${crHash}`;
  const f = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
  const sigKey = f(f(f(f("AWS4" + sk, ds), region), "s3"), "aws4_request");
  const sig = crypto.createHmac("sha256", sigKey).update(sts).digest("hex");
  const auth = `AWS4-HMAC-SHA256 Credential=${ak}/${cs}, SignedHeaders=${sh}, Signature=${sig}`;

  const httpHeaders = {
    Authorization: auth,
    Host: host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": ts,
    "Content-Length": body.length,
    "Content-Type": contentType,
  };

  return new Promise((resolve) => {
    const req = https.request(
      { hostname: host, path: reqPath, method: "PUT", headers: httpHeaders },
      (res) => { let d = ""; res.on("data", (x) => (d += x)); res.on("end", () => resolve({ status: res.statusCode, body: d })); }
    );
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.write(body); req.end();
  });
}

// ─── SigV2 PUT ────────────────────────────────────────────────────────────────
async function testV2() {
  const body = Buffer.from("ping");
  const contentType = "text/plain";
  const dateStr = new Date().toUTCString();
  const resource = `/${bucket}/_diag-test.txt`;
  const sts = `PUT\n\n${contentType}\n${dateStr}\n${resource}`;
  const sig = crypto.createHmac("sha1", sk).update(sts).digest("base64");
  const auth = `AWS ${ak}:${sig}`;

  return new Promise((resolve) => {
    const req = https.request(
      { hostname: "s3.regru.cloud", path: resource, method: "PUT",
        headers: { Authorization: auth, Host: "s3.regru.cloud", Date: dateStr, "Content-Type": contentType, "Content-Length": body.length } },
      (res) => { let d = ""; res.on("data", (x) => (d += x)); res.on("end", () => resolve({ status: res.statusCode, body: d })); }
    );
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.write(body); req.end();
  });
}

// ─── DNS check for virtual-hosted style ───────────────────────────────────────
async function checkVirtualHost() {
  const vh = `${bucket}.s3.regru.cloud`;
  try {
    const addrs = await dns.resolve4(vh);
    return { resolves: true, host: vh, addrs };
  } catch {
    return { resolves: false, host: vh };
  }
}

// ─── Run all combos ───────────────────────────────────────────────────────────
console.log("── SigV4 path-style (s3.regru.cloud/bucket/key) ──────────────────");
const v4combos = [
  // Match exactly what AWS SDK sends: content-type signed, actual hash
  { region: "us-east-1", unsigned: false, signCT: true,  label: "SDK-style    us-east-1 SIGNED  +CT" },
  { region: "default",   unsigned: false, signCT: true,  label: "SDK-style    default   SIGNED  +CT" },
  { region: "ru-1",      unsigned: false, signCT: true,  label: "SDK-style    ru-1      SIGNED  +CT" },
  // Without content-type (our raw test before)
  { region: "us-east-1", unsigned: false, signCT: false, label: "no-CT        us-east-1 SIGNED  -CT" },
  // UNSIGNED-PAYLOAD + content-type (what SDK sends with our middleware)
  { region: "us-east-1", unsigned: true,  signCT: true,  label: "SDK-unsigned us-east-1 UNSIGNED+CT" },
  { region: "default",   unsigned: true,  signCT: true,  label: "SDK-unsigned default   UNSIGNED+CT" },
];

for (const c of v4combos) {
  const r = await testV4(c);
  const code = r.body.match(/<Code>(.+?)<\/Code>/)?.[1] ?? "?";
  console.log(`${c.label} → HTTP ${r.status} (${code})`);
  if (r.status === 200) { console.log("  ✓ SUCCESS!"); }
}

console.log("\n── SigV2 (legacy S3 authentication) ──────────────────────────────");
const v2 = await testV2();
const v2code = v2.body.match(/<Code>(.+?)<\/Code>/)?.[1] ?? "?";
console.log(`SigV2 → HTTP ${v2.status} (${v2code})`);
if (v2.status === 200) console.log("  ✓ SUCCESS with SigV2!");

console.log("\n── Virtual-hosted DNS check ───────────────────────────────────────");
const dns4 = await checkVirtualHost();
if (dns4.resolves) {
  console.log(`${dns4.host} → resolves to ${dns4.addrs.join(", ")}`);
  console.log("  → Virtual-hosted style might work — testing...");
  const vhTest = await testV4({ region: "us-east-1", unsigned: false, signCT: true, host: `${bucket}.s3.regru.cloud`, pathStyle: false });
  const vhCode = vhTest.body.match(/<Code>(.+?)<\/Code>/)?.[1] ?? "?";
  console.log(`  virtual-hosted us-east-1 SIGNED+CT → HTTP ${vhTest.status} (${vhCode})`);
} else {
  console.log(`${dns4.host} → does NOT resolve (virtual-hosted style not available)`);
}
