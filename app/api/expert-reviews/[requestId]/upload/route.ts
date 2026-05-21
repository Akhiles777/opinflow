import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadExpertReviewReport } from "@/lib/storage";
import { completeExpertReviewAction } from "@/actions/expert-reviews";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { requestId } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "INVALID_FILE_TYPE" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 400 });
  }

  const requestRow = await prisma.expertReviewRequest.findUnique({
    where: { id: requestId },
    select: { id: true, surveyId: true, status: true },
  });

  if (!requestRow) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const reportUrl = await uploadExpertReviewReport(requestId, buffer);
    const result = await completeExpertReviewAction({ requestId, reportUrl });

    if ("error" in result && result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true, reportUrl });
  } catch (error) {
    console.error("[expert-reviews][upload-error]", error);
    return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
  }
}
