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
      return NextResponse.json({ error: "PAYOUTS_NOT_CONFIGURED", banks: [] }, { status: 503 });
    }
    return NextResponse.json({ error: "SBP_BANKS_FAILED", banks: [] }, { status: 502 });
  }
}
