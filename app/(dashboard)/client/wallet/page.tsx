import PageHeader from "@/components/dashboard/PageHeader";
import ClientWalletClient from "@/components/client/ClientWalletClient";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function ClientWalletPage({
  searchParams,
}: {
  searchParams?: Promise<{ payment?: string }>;
}) {
  const session = await requireRole("CLIENT");
  const params = (await searchParams) ?? {};

  const [wallet, payments] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: {
        balance: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            createdAt: true,
            type: true,
            description: true,
            amount: true,
            status: true,
          },
        },
      },
    }),
    prisma.payment.findMany({
      where: { userId: session.user.id, type: "DEPOSIT" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        confirmationUrl: true,
      },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Кошелёк" subtitle="Баланс, реальные пополнения через ЮKassa и история операций." />

      <div className="mt-8">
        <ClientWalletClient
          balance={Number(wallet?.balance ?? 0)}
          paymentSuccess={params.payment === "success"}
          transactions={
            wallet?.transactions.map((item) => ({
              id: item.id,
              date: formatDate(item.createdAt),
              type: item.type,
              description: item.description ?? "Операция",
              amount: item.type === "DEPOSIT" || item.type === "REFUND" ? Number(item.amount) : -Math.abs(Number(item.amount)),
              status:
                item.status === "COMPLETED"
                  ? "completed"
                  : item.status === "PENDING"
                    ? "pending"
                    : item.status === "CANCELLED"
                      ? "draft"
                      : "rejected",
            })) ?? []
          }
          payments={payments.map((item) => ({
            id: item.id,
            date: formatDate(item.createdAt),
            amount: Number(item.amount),
            status: item.status,
            confirmationUrl: item.confirmationUrl ?? null,
          }))}
        />
      </div>
    </div>
  );
}
