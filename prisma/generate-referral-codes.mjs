// Run: docker cp prisma/generate-referral-codes.mjs opinflow-app-1:/app/prisma/
//      docker exec opinflow-app-1 node prisma/generate-referral-codes.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function randomCode() {
  return Math.random().toString(36).slice(2, 9).toUpperCase();
}

async function main() {
  const users = await prisma.user.findMany({
    where: { referralCode: null },
    select: { id: true },
  });

  if (users.length === 0) {
    console.log("All users already have a referralCode. Nothing to do.");
    return;
  }

  let updated = 0;
  for (const user of users) {
    let code = randomCode();
    // Retry if collision (extremely rare but safe)
    for (let attempt = 0; attempt < 5; attempt++) {
      const exists = await prisma.user.findUnique({ where: { referralCode: code } });
      if (!exists) break;
      code = randomCode();
    }
    await prisma.user.update({ where: { id: user.id }, data: { referralCode: code } });
    updated++;
  }

  console.log(`Generated referralCode for ${updated} user(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
