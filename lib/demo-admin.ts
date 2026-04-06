import type { Role } from "@prisma/client";

export const DEMO_ADMIN_ID = "demo-admin";
export const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL?.trim().toLowerCase() || "admin@demo.local";
export const DEMO_ADMIN_LOGIN = process.env.DEMO_ADMIN_LOGIN?.trim().toLowerCase() || "admin";
export const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD?.trim() || "admin12345";

export type DemoAdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: "ACTIVE";
  image: null;
};

export function matchesDemoAdmin(identifier: string, password: string) {
  const normalized = identifier.trim().toLowerCase();
  return (
    password === DEMO_ADMIN_PASSWORD &&
    (normalized === DEMO_ADMIN_LOGIN || normalized === DEMO_ADMIN_EMAIL)
  );
}

export function getDemoAdminUser(): DemoAdminUser {
  return {
    id: DEMO_ADMIN_ID,
    email: DEMO_ADMIN_EMAIL,
    name: "Демо-администратор",
    role: "ADMIN",
    status: "ACTIVE",
    image: null,
  };
}
