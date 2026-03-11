import * as React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { IconChart, IconGrid, IconSettings, IconUser } from "@/components/ui/icons";

const nav = [
  { label: "Обзор", href: "/admin/dashboard", icon: <IconGrid /> },
  { label: "Модерация", href: "/admin/moderation", icon: <IconSettings /> },
  { label: "Пользователи", href: "/admin/users", icon: <IconUser /> },
  { label: "Финансы", href: "/admin/finance", icon: <IconChart /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell roleLabel="Админ-панель" nav={nav} scale="lg">
      {children}
    </DashboardShell>
  );
}
