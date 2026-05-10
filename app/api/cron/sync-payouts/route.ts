import { NextResponse } from "next/server";
import { syncProcessingWithdrawals } from "@/lib/payment-processing";

function isAuthorized(request: Request) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  if (!secret) {
    return false;
  }
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? request.headers.get("x-cron-secret") ?? "";
  return token === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const result = await syncProcessingWithdrawals({ limit: 200 });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron][sync-payouts]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

