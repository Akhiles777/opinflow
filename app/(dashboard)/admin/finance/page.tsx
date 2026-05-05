import PageHeader from "@/components/dashboard/PageHeader";
import AdminFinanceClient from "@/components/dashboard/AdminFinanceClient";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { mapTransactionStatus } from "@/lib/dashboard-data";

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

export default async function AdminFinancePage() {
  await requireRole("ADMIN");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [transactions, withdrawals] = await Promise.all([
    prisma.transaction.findMany({
      where: { createdAt: { gte: monthStart } },
      orderBy: { createdAt: "desc" },
      include: {
        wallet: {
          select: {
            user: {
              select: { email: true },
            },
          },
        },
      },
      take: 100,
    }),
    prisma.withdrawalRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        amount: true,
        method: true,
        requisites: true,
        status: true,
        adminNote: true,
        createdAt: true,
        user: {
          select: { email: true },
        },
      },
    }),
  ]);

  const turnover = transactions
    .filter((item) => item.status === "COMPLETED")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);
  const commission = transactions
    .filter((item) => item.type === "SPENDING")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)) * 0.15, 0);
  const paidOut = transactions
    .filter((item) => item.type === "WITHDRAWAL" && item.status === "COMPLETED")
    .reduce((sum, item) => sum + Math.abs(Number(item.amount)), 0);

  return (
    <div>
      <PageHeader title="Финансы" subtitle="Транзакции платформы и заявки на вывод средств респондентов." />

      <div className="mt-8">
        <AdminFinanceClient
          stats={{ turnover, commission, paidOut }}
          transactions={transactions.map((item) => ({
            id: item.id,
            date: formatDate(item.createdAt),
            type: item.type,
            user: item.wallet.user.email,
            amount: Number(item.amount),
            fee: item.type === "SPENDING" ? Math.abs(Number(item.amount)) * 0.15 : 0,
            status: mapTransactionStatus(item.status),
          }))}
          withdrawals={withdrawals.map((item) => ({
            id: item.id,
            user: item.user.email,
            method: item.method,
            methodLabel: item.method === "CARD" ? "Банковская карта" : item.method === "SBP" ? "СБП" : "ЮMoney",
            amount: Number(item.amount),
            requisitesMasked: maskRequisites(item.method, item.requisites),
            date: formatDate(item.createdAt),
            status: item.status,
            adminNote: item.adminNote,
          }))}
        />
      </div>
    </div>
  );
}
