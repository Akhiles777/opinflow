import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AdminUsersClient from "@/components/dashboard/AdminUsersClient";
import PageHeader from "@/components/dashboard/PageHeader";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const params = (await searchParams) ?? {};
  const tab = params.tab ?? "all";
  const q = (params.q ?? "").toLowerCase().trim();

  const [users, complaints] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        respondentProfile: { select: { city: true } },
        clientProfile: { select: { companyName: true } },
        wallet: { select: { balance: true, totalEarned: true } },
        _count: { select: { surveySessions: true, surveysCreated: true } },
      },
    }),
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reason: true,
        details: true,
        status: true,
        createdAt: true,
        fromUser: { select: { email: true, name: true } },
        survey: { select: { id: true, title: true } },
      },
    }),
  ]);

  const mappedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name ?? "",
    role: u.role,
    status: u.status,
    registered: formatDate(u.createdAt),
    balance: Number(u.wallet?.balance ?? 0),
    totalEarned: Number(u.wallet?.totalEarned ?? 0),
    surveysCount: u.role === "CLIENT" ? u._count.surveysCreated : u._count.surveySessions,
    extra: u.role === "CLIENT"
      ? u.clientProfile?.companyName ?? ""
      : u.respondentProfile?.city ?? "",
  }));

  const mappedComplaints = complaints.map((c) => ({
    id: c.id,
    fromEmail: c.fromUser.email,
    fromName: c.fromUser.name ?? "",
    surveyTitle: c.survey?.title ?? "—",
    surveyId: c.survey?.id ?? null,
    reason: c.reason,
    details: c.details ?? "",
    status: c.status,
    date: formatDate(c.createdAt),
  }));

  const filteredUsers = mappedUsers.filter((u) => {
    const matchesTab =
      tab === "all" ? true :
      tab === "blocked" ? u.status === "BLOCKED" :
      u.role === tab;
    const matchesSearch = !q || u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div>
      <PageHeader title="Пользователи" subtitle="Управление пользователями, роли, статусы и жалобы." />
      <div className="mt-8">
        <AdminUsersClient
          users={filteredUsers}
          tabCounts={{
            all: mappedUsers.length,
            RESPONDENT: mappedUsers.filter((u) => u.role === "RESPONDENT").length,
            CLIENT: mappedUsers.filter((u) => u.role === "CLIENT").length,
            blocked: mappedUsers.filter((u) => u.status === "BLOCKED").length,
          }}
          complaints={mappedComplaints}
          activeTab={tab}
          searchQuery={params.q ?? ""}
        />
      </div>
    </div>
  );
}
