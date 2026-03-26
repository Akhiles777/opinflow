import type { Role } from "@prisma/client";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function resolveManagedRole(email: string, fallback: Role): Role {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return fallback;
  }

  return getAdminEmails().includes(normalizedEmail) ? "ADMIN" : fallback;
}
