import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadExpertReviewReport } from "@/lib/storage";
import { notify } from "@/lib/notifications";

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

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Загрузите PDF-файл" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Файл слишком большой. Максимум 10 МБ" }, { status: 400 });
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
    reportUrl = await uploadExpertReviewReport(requestId, buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    console.error("[expert-reviews][upload] storage error:", error);

    if (message.includes("SUPABASE_STORAGE_NOT_CONFIGURED")) {
      return NextResponse.json({ error: "Хранилище файлов не настроено. Проверьте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY." }, { status: 500 });
    }
    if (message.includes("SUPABASE_BUCKET_CREATE_FAILED")) {
      return NextResponse.json({ error: "Не удалось создать бакет в хранилище. Проверьте права сервисного ключа Supabase." }, { status: 500 });
    }
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
    return NextResponse.json({ error: "Файл загружен, но не удалось обновить статус заявки. Обратитесь в поддержку." }, { status: 500 });
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
