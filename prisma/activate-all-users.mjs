// Run: docker compose exec app node prisma/activate-all-users.mjs
// Marks all PENDING_VERIFICATION users as ACTIVE with emailVerified = now()

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { status: "PENDING_VERIFICATION" },
    data: {
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  console.log(`Updated ${result.count} user(s) from PENDING_VERIFICATION → ACTIVE`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
