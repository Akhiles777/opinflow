import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripQuotes(s: string) {
  return (s ?? "").replace(/^["']|["']$/g, "").trim();
}

async function checkS3(): Promise<{ ok: boolean; error?: string; hint?: string; url?: string }> {
  try {
    const {
      S3Client,
      PutObjectCommand,
      DeleteObjectCommand,
      HeadBucketCommand,
    } = await import("@aws-sdk/client-s3");

    const accessKeyId = stripQuotes(process.env.S3_ACCESS_KEY ?? "");
    const secretAccessKey = stripQuotes(process.env.S3_SECRET_KEY ?? "");
    const bucket = stripQuotes(process.env.S3_BUCKET ?? "opinflow-media");
    const endpoint = stripQuotes(process.env.S3_ENDPOINT ?? "https://s3.regru.cloud");

    if (!accessKeyId || !secretAccessKey) {
      return { ok: false, error: "S3_ACCESS_KEY or S3_SECRET_KEY not set" };
    }

    const client = new S3Client({
      region: "us-east-1",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    client.middlewareStack.add(
      (next) => (args) => {
        (args.request as { headers: Record<string, string> }).headers[
          "x-amz-content-sha256"
        ] = "UNSIGNED-PAYLOAD";
        return next(args);
      },
      { step: "build", name: "unsignedPayload" },
    );

    // Step 1: check bucket exists and credentials are valid
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (bucketErr: unknown) {
      const msg = bucketErr instanceof Error ? bucketErr.message : String(bucketErr);
      const code = (bucketErr as { Code?: string; name?: string }).Code ?? (bucketErr as { name?: string }).name ?? "";
      if (code === "NoSuchBucket" || msg.includes("404") || msg.includes("NoSuchBucket")) {
        return {
          ok: false,
          error: `Bucket "${bucket}" не найден`,
          hint: `Создайте bucket с именем "${bucket}" в панели управления Reg.ru S3`,
        };
      }
      if (code === "403" || code === "Forbidden" || msg.includes("403") || msg.includes("Forbidden") || msg.includes("AccessDenied")) {
        return {
          ok: false,
          error: "Неверные credentials (Access Denied)",
          hint: "Проверьте S3_ACCESS_KEY и S3_SECRET_KEY в .env.production",
        };
      }
      return { ok: false, error: `HeadBucket failed: ${msg}`, hint: "Проверьте S3_ENDPOINT и credentials" };
    }

    // Step 2: test write + delete
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

function probePort(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const net = require("net") as typeof import("net");
    const socket = net.createConnection(port, host);
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
    socket.on("connect", () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.on("error", () => { clearTimeout(timer); resolve(false); });
  });
}

async function checkEmail(): Promise<{ ok: boolean; error?: string; hint?: string; host?: string; openPorts?: number[] }> {
  try {
    const nodemailer = (await import("nodemailer")).default;

    const host = stripQuotes(process.env.MAIL_HOST ?? "");
    const port = Number(stripQuotes(process.env.MAIL_PORT ?? "465")) || 465;
    const user = stripQuotes(process.env.MAIL_USER ?? "");
    const pass = stripQuotes(process.env.MAIL_PASS ?? "");

    if (!host || !user || !pass) {
      return { ok: false, error: "MAIL_HOST/USER/PASS not set" };
    }

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
    const msg = err instanceof Error ? err.message : String(err);
    const isBlocked = msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("econnrefused") || msg.toLowerCase().includes("connect");

    let openPorts: number[] | undefined;
    if (isBlocked) {
      const mailHost = stripQuotes(process.env.MAIL_HOST ?? "mail.hosting.reg.ru");
      const results = await Promise.all(
        [25, 465, 587, 2525].map(async (p) => ({ p, open: await probePort(mailHost, p) }))
      );
      openPorts = results.filter((r) => r.open).map((r) => r.p);
    }

    return {
      ok: false,
      error: msg,
      openPorts,
      hint: isBlocked
        ? openPorts && openPorts.length > 0
          ? `Открытые порты: ${openPorts.join(", ")}. Установите MAIL_PORT=${openPorts[0]} в .env.production`
          : "Все SMTP-порты (25, 465, 587, 2525) заблокированы VPS. Обратитесь в поддержку Reg.ru для разблокировки порта 587"
        : "Проверьте MAIL_USER и MAIL_PASS",
    };
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
      S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ? `${stripQuotes(process.env.S3_ACCESS_KEY).slice(0, 4)}…` : "(not set)",
      MAIL_HOST: stripQuotes(process.env.MAIL_HOST ?? "") || "(not set)",
      MAIL_PORT: stripQuotes(process.env.MAIL_PORT ?? "") || "(not set)",
      MAIL_USER: stripQuotes(process.env.MAIL_USER ?? "") || "(not set)",
      MAIL_PASS: process.env.MAIL_PASS
        ? `${stripQuotes(process.env.MAIL_PASS).slice(0, 2)}…(${stripQuotes(process.env.MAIL_PASS).length} chars)`
        : "(not set)",
    },
  });
}
