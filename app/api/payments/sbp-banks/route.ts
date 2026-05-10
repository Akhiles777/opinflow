import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  YUKASSA_SBP_CONTRACT_FORBIDDEN_MERCHANT_RU,
  YUKASSA_SBP_CONTRACT_FORBIDDEN_RESPONDENT_RU,
} from "@/lib/yukassa-payout-copy";
import { fetchSbpBanksForPayouts } from "@/lib/yukassa";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "RESPONDENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const result = await fetchSbpBanksForPayouts();
    if (result.ok) {
      return NextResponse.json({
        banks: result.banks,
        sbpAvailability: "available" as const,
      });
    }

    if (result.contractForbidden) {
      console.warn("[payments][sbp-banks][contract-forbidden]", {
        httpStatus: result.httpStatus,
        yukassaCode: result.yukassaCode,
        snippet: result.rawSnippet.slice(0, 200),
      });
      return NextResponse.json({
        banks: [],
        sbpAvailability: "contract_forbidden" as const,
        userMessage: YUKASSA_SBP_CONTRACT_FORBIDDEN_RESPONDENT_RU,
        merchantHint: YUKASSA_SBP_CONTRACT_FORBIDDEN_MERCHANT_RU,
        yukassaCode: result.yukassaCode,
        technical: `${result.httpStatus} ${result.rawSnippet}`.slice(0, 480),
      });
    }

    console.error("[payments][sbp-banks]", {
      httpStatus: result.httpStatus,
      yukassaCode: result.yukassaCode,
      snippet: result.rawSnippet.slice(0, 200),
    });

    const detail =
      typeof result.rawSnippet === "string" ? `${result.httpStatus} ${result.rawSnippet}`.slice(0, 480) : null;

    return NextResponse.json(
      {
        error: "SBP_BANKS_FAILED",
        banks: [],
        sbpAvailability: "error" as const,
        detail,
        yukassaCode: result.yukassaCode,
      },
      { status: 502 },
    );
  } catch (error) {
    console.error("[payments][sbp-banks]", error);
    const message = error instanceof Error ? error.message : "SBP_BANKS_FAILED";
    if (message.includes("YUKASSA_PAYOUT_NOT_CONFIGURED")) {
      return NextResponse.json(
        { error: "PAYOUTS_NOT_CONFIGURED", banks: [], detail: null, sbpAvailability: "not_configured" as const },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: "SBP_BANKS_FAILED",
        banks: [],
        sbpAvailability: "error" as const,
        detail: message.slice(0, 480),
        yukassaCode: null,
      },
      { status: 502 },
    );
  }
}
