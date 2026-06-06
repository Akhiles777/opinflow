import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadExpertReviewReport } from "@/lib/storage";
import { notify } from "@/lib/notifications";

const ALLOWED_MIME: Record<string, "pdf" | "docx" | "txt"> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
};

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Недостаточно прав" }, { status: 401 });
  }

  const { requestId } = await params;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать файл" }, { status: 400 });
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не приложен" }, { status: 400 });
  }

  // Normalize MIME: text files from some OS omit charset suffix
  const rawMime = file.type.split(";")[0].trim().toLowerCase();
  const extension = ALLOWED_MIME[rawMime];

  if (!extension) {
    return NextResponse.json(
      { error: "Неподдерживаемый формат. Загрузите PDF, DOCX или TXT" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл слишком большой. Максимум 20 МБ" }, { status: 400 });
  }

  const reviewRequest = await prisma.expertReviewRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      userId: true,
      survey: { select: { id: true, title: true } },
    },
  });

  if (!reviewRequest) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (reviewRequest.status !== "PENDING" && reviewRequest.status !== "ASSIGNED") {
    return NextResponse.json({ error: "Заявка уже закрыта или отклонена" }, { status: 400 });
  }

  let reportUrl: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    reportUrl = await uploadExpertReviewReport(requestId, buffer, extension);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("[expert-reviews][upload] storage error:", error);
    return NextResponse.json({ error: `Ошибка загрузки файла: ${message}` }, { status: 500 });
  }

  try {
    await prisma.expertReviewRequest.update({
      where: { id: requestId },
      data: {
        status: "COMPLETED",
        reportUrl,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("[expert-reviews][upload] db update error:", error);
    return NextResponse.json(
      { error: "Файл загружен, но не удалось обновить статус заявки." },
      { status: 500 },
    );
  }

  try {
    await notify({
      userId: reviewRequest.userId,
      type: "SYSTEM",
      title: "Экспертный разбор готов",
      body: `По опросу "${reviewRequest.survey.title}" загружено экспертное заключение.`,
      link: `/client/surveys/${reviewRequest.survey.id}`,
    });
  } catch (error) {
    console.error("[expert-reviews][upload] notify error:", error);
  }

  revalidatePath("/admin/experts");
  revalidatePath(`/client/surveys/${reviewRequest.survey.id}`);

  return NextResponse.json({ ok: true, reportUrl });
}
