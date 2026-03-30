import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function ensureUserSetup(userId: string, role: Role) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      wallet: {
        select: { id: true },
      },
      respondentProfile: {
        select: { id: true },
      },
      clientProfile: {
        select: { id: true },
      },
    },
  });

  if (!user) {
    return;
  }

  const operations: Promise<unknown>[] = [];

  if (!user.wallet) {
    operations.push(prisma.wallet.create({ data: { userId } }));
  }

  if (role === "RESPONDENT" && !user.respondentProfile) {
    operations.push(prisma.respondentProfile.create({ data: { userId } }));
  }

  if (role === "CLIENT" && !user.clientProfile) {
    operations.push(prisma.clientProfile.create({ data: { userId } }));
  }

  if (operations.length > 0) {
    await Promise.all(operations);
  }
}
