import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripQuotes(s: string) {
  return (s ?? "").replace(/^["']|["']$/g, "").trim();
}

async function checkS3(): Promise<{ ok: boolean; error?: string; url?: string }> {
  try {
    const { S3Client, PutObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    const key = stripQuotes(process.env.S3_ACCESS_KEY ?? "");
    const secret = stripQuotes(process.env.S3_SECRET_KEY ?? "");
    const bucket = stripQuotes(process.env.S3_BUCKET ?? "opinflow-media");
    const endpoint = stripQuotes(process.env.S3_ENDPOINT ?? "https://s3.regru.cloud");

    if (!key || !secret) return { ok: false, error: "S3_ACCESS_KEY or S3_SECRET_KEY not set" };

    const client = new S3Client({
      region: "ru-1",
      endpoint,
      credentials: { accessKeyId: key, secretAccessKey: secret },
      forcePathStyle: true,
    });

    const testKey = `_system-check/ping-${Date.now()}.txt`;
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: testKey,
      Body: Buffer.from("ping"),
      ContentType: "text/plain",
    }));
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));

    return { ok: true, url: `${endpoint}/${bucket}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkEmail(): Promise<{ ok: boolean; error?: string; host?: string }> {
  try {
    const nodemailer = (await import("nodemailer")).default;

    const host = stripQuotes(process.env.MAIL_HOST ?? "");
    const port = Number(stripQuotes(process.env.MAIL_PORT ?? "465")) || 465;
    const user = stripQuotes(process.env.MAIL_USER ?? "");
    const pass = stripQuotes(process.env.MAIL_PASS ?? "");

    if (!host || !user || !pass) return { ok: false, error: "MAIL_HOST/USER/PASS not set" };

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8_000,
    });

    await transporter.verify();
    return { ok: true, host: `${host}:${port}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [s3, email] = await Promise.all([checkS3(), checkEmail()]);

  return NextResponse.json({
    s3,
    email,
    env: {
      S3_BUCKET: stripQuotes(process.env.S3_BUCKET ?? "") || "(not set)",
      S3_ENDPOINT: stripQuotes(process.env.S3_ENDPOINT ?? "") || "(not set)",
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ? `${process.env.S3_ACCESS_KEY.slice(0, 4)}…` : "(not set)",
      MAIL_HOST: stripQuotes(process.env.MAIL_HOST ?? "") || "(not set)",
      MAIL_PORT: stripQuotes(process.env.MAIL_PORT ?? "") || "(not set)",
      MAIL_USER: stripQuotes(process.env.MAIL_USER ?? "") || "(not set)",
      MAIL_PASS: process.env.MAIL_PASS ? `${stripQuotes(process.env.MAIL_PASS).slice(0, 2)}…(${stripQuotes(process.env.MAIL_PASS).length} chars)` : "(not set)",
    },
  });
}
