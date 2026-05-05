import PageHeader from "@/components/dashboard/PageHeader";
import RespondentWalletClient from "@/components/respondent/RespondentWalletClient";
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

function maskRequisites(method: "CARD" | "SBP" | "WALLET", requisites: unknown) {
  const data = requisites && typeof requisites === "object" ? (requisites as Record<string, string>) : {};

  if (method === "CARD") {
    const digits = (data.cardNumber || "").replace(/\D/g, "");
    return digits ? `**** **** **** ${digits.slice(-4)}` : "Карта";
  }

  if (method === "SBP") {
    const phone = data.phone || "";
    return phone ? `${phone.slice(0, 2)}***${phone.slice(-4)}` : "СБП";
  }

  const walletNumber = data.walletNumber || "";
  return walletNumber ? `ЮMoney •••${walletNumber.slice(-4)}` : "ЮMoney";
}

export default async function RespondentWalletPage() {
  const session = await requireRole("RESPONDENT");

  const [wallet, withdrawalRequests] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: session.user.id },
      select: {
        balance: true,
        totalEarned: true,
        totalSpent: true,
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 40,
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
    prisma.withdrawalRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        adminNote: true,
        requisites: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Кошелёк" subtitle="Баланс, заявки на вывод и история начислений." />

      <div className="mt-6">
        <RespondentWalletClient
          balance={Number(wallet?.balance ?? 0)}
          totalEarned={Number(wallet?.totalEarned ?? 0)}
          totalSpent={Number(wallet?.totalSpent ?? 0)}
          transactions={
            wallet?.transactions.map((item) => ({
              id: item.id,
              date: formatDate(item.createdAt),
              type: item.type === "WITHDRAWAL" ? "Вывод" : "Начисление",
              description: item.description ?? "Операция",
              amount: item.type === "WITHDRAWAL" ? -Math.abs(Number(item.amount)) : Number(item.amount),
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
          withdrawalRequests={withdrawalRequests.map((item) => ({
            id: item.id,
            date: formatDate(item.createdAt),
            method: item.method,
            amount: Number(item.amount),
            status: item.status,
            adminNote: item.adminNote,
            requisitesMasked: maskRequisites(item.method, item.requisites),
          }))}
        />
      </div>
    </div>
  );
}
