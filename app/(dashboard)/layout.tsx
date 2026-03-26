import * as React from "react";
import { notFound } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getDashboardViewer } from "@/lib/dashboard-data";
import { requireAuth } from "@/lib/auth-utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const viewer = await getDashboardViewer(session.user.id);

  if (!viewer) {
    notFound();
  }

  return <DashboardShell viewer={viewer}>{children}</DashboardShell>;
}
