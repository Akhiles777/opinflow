import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripQuotes(s: string) {
  return (s ?? "").replace(/^["']|["']$/g, "").trim();
}

async function checkS3(): Promise<{ ok: boolean; error?: string; hint?: string; url?: string }> {
  try {
    const { uploadToS3, deleteFromS3, S3_BUCKET, S3_ENDPOINT } = await import("@/lib/s3");

    const ak = stripQuotes(process.env.S3_ACCESS_KEY ?? "");
    const sk = stripQuotes(process.env.S3_SECRET_KEY ?? "");
    if (!ak || !sk) {
      return { ok: false, error: "S3_ACCESS_KEY or S3_SECRET_KEY not set" };
    }

    const testKey = `_system-check/ping-${Date.now()}.txt`;
    await uploadToS3(Buffer.from("ping"), testKey, "text/plain");
    await deleteFromS3(testKey);

    const endpoint = stripQuotes(process.env.S3_ENDPOINT ?? S3_ENDPOINT);
    const bucket = stripQuotes(process.env.S3_BUCKET ?? S3_BUCKET);
    return { ok: true, url: `${endpoint}/${bucket}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const hint = msg.includes("403") || msg.includes("Forbidden") || msg.includes("AccessDenied")
      ? "Проверьте S3_ACCESS_KEY и S3_SECRET_KEY"
      : msg.includes("404") || msg.includes("NoSuchBucket")
        ? "Bucket не найден — создайте в панели Reg.ru S3"
        : "Проверьте S3_ENDPOINT и credentials";
    return { ok: false, error: msg, hint };
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

async function checkMozen(): Promise<{ ok: boolean; error?: string; endpoints?: unknown[] }> {
  const username = stripQuotes(process.env.MOZEN_USERNAME ?? "");
  const password = stripQuotes(process.env.MOZEN_PASSWORD ?? "");
  const baseUrl = stripQuotes(process.env.MOZEN_BASE_URL ?? "https://hmetal.mozenscrap.ru");

  if (!username || !password) {
    return { ok: false, error: "MOZEN_USERNAME/PASSWORD not set" };
  }

  try {
    // Step 1: get token
    const loginRes = await fetch(`${baseUrl}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!loginRes.ok) {
      return { ok: false, error: `Login failed: ${loginRes.status} ${await loginRes.text()}` };
    }
    const { access } = await loginRes.json() as { access: string };

    // Step 2: list endpoints
    const epRes = await fetch(`${baseUrl}/endpoint/`, {
      headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    });
    const epText = await epRes.text();
    let endpoints: unknown[] = [];
    try { endpoints = JSON.parse(epText); } catch { /* not JSON */ }

    const summary = Array.isArray(endpoints) ? endpoints.map((ep: unknown) => {
      const e = ep as Record<string, unknown>;
      const balances = Array.isArray(e.balances) ? e.balances : [];
      const bal = balances[0] as Record<string, unknown> | undefined;
      const status = e.status as Record<string, unknown> | undefined;
      return {
        id: e.id,
        name: e.short_name,
        status: status?.iname,
        balance: bal ? `${bal.balance} ${bal.currency} (${bal.bank_name} ...${String(bal.acc_number).slice(-4)})` : "—",
        needsFunding: bal ? Number(bal.balance) === 0 : true,
      };
    }) : [];

    const hasBalance = summary.some((s) => !s.needsFunding);

    return {
      ok: epRes.ok && hasBalance,
      error: epRes.ok
        ? hasBalance ? undefined : "Баланс торговой точки = 0 — пополните счёт в кабинете Mozen"
        : `GET /endpoint/ → ${epRes.status}: ${epText.slice(0, 300)}`,
      endpoints: summary,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [s3, email, mozen] = await Promise.all([checkS3(), checkEmail(), checkMozen()]);

  return NextResponse.json({
    s3,
    email,
    mozen,
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
