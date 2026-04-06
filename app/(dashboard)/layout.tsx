import * as React from "react";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getDashboardViewer } from "@/lib/dashboard-data";
import { requireAuth } from "@/lib/auth-utils";
import { DEMO_ADMIN_ID } from "@/lib/demo-admin";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const viewer = await getDashboardViewer(session.user.id);

  if (!viewer && session.user.id === DEMO_ADMIN_ID && session.user.role === "ADMIN") {
    return (
      <DashboardShell
        viewer={{
          id: session.user.id,
          name: session.user.name ?? "Демо-администратор",
          email: session.user.email ?? "admin@demo.local",
          image: session.user.image ?? null,
          role: "ADMIN",
          roleLabel: "Администратор",
          initials: "DA",
        }}
      >
        {children}
      </DashboardShell>
    );
  }

  if (!viewer) {
    notFound();
  }

  return <DashboardShell viewer={viewer}>{children}</DashboardShell>;
}
