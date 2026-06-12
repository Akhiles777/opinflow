#!/usr/bin/env node
// Usage: node prisma/create-admin.mjs <email> <password>
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: node prisma/create-admin.mjs <email> <password>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
      emailVerified: new Date(),
      image: null,
    },
    create: {
      email,
      name: "Администратор",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  console.log(`✓ Admin created/updated: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
