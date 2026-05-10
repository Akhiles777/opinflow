import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listSbpParticipantBanks } from "@/lib/yukassa";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "RESPONDENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const banks = await listSbpParticipantBanks();
    return NextResponse.json({ banks });
  } catch (error) {
    console.error("[payments][sbp-banks]", error);
    const message = error instanceof Error ? error.message : "SBP_BANKS_FAILED";
    if (message.includes("YUKASSA_PAYOUT_NOT_CONFIGURED")) {
      return NextResponse.json({ error: "PAYOUTS_NOT_CONFIGURED", banks: [], detail: null }, { status: 503 });
    }

    let detail = message;
    const match = message.match(/YUKASSA_SBP_BANKS_FAILED:\s*(\d+)\s*([\s\S]*)/);
    if (match) {
      const body = match[2]?.trim() ?? "";
      detail = `${match[1]} ${body.slice(0, 400)}`;
    }

    let yukassaCode: string | null = null;
    try {
      const jsonStart = detail.indexOf("{");
      if (jsonStart >= 0) {
        const parsed = JSON.parse(detail.slice(jsonStart)) as { code?: string };
        if (typeof parsed.code === "string") {
          yukassaCode = parsed.code;
        }
      }
    } catch {
      // ignore parse errors
    }

    return NextResponse.json(
      {
        error: "SBP_BANKS_FAILED",
        banks: [],
        detail: detail.slice(0, 480),
        yukassaCode,
      },
      { status: 502 },
    );
  }
}
