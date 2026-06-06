import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makePrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

// In development, the PrismaClient instance may be cached in globalThis from a previous
// module load. If prisma generate was run while the dev server was already running, the
// cached instance predates the schema change and won't have new models (e.g. `expert`).
// We detect this by probing a sentinel model and discard the stale instance.
function isFreshClient(client: PrismaClient): boolean {
  try {
    // `expert` is the most recently added model — if it's missing, the client is stale.
    return typeof (client as unknown as Record<string, unknown>)["expert"] === "object";
  } catch {
    return false;
  }
}

const cached = globalForPrisma.prisma;
export const prisma = (cached && isFreshClient(cached)) ? cached : makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
