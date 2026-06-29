import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/dashboard/PageHeader";
import SelfServiceCreator from "@/components/self-service/SelfServiceCreator";
import Link from "next/link";

export default async function SelfServiceCreatePage() {
  const session = await requireRole("CLIENT");

  const existingCount = await prisma.survey.count({
    where: { creatorId: session.user.id, surveyMode: "SELF_SERVICE" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/client/surveys/self-service" className="text-sm text-dash-muted hover:text-dash-heading transition-colors">
          ← Анкеты для своей базы
        </Link>
      </div>
      <PageHeader title="Новая анкета" />
      <SelfServiceCreator existingCount={existingCount} />
    </div>
  );
}
