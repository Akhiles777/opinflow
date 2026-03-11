import * as React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { IconGrid, IconUser, IconWallet } from "@/components/ui/icons";

const nav = [
  { label: "Лента опросов", href: "/respondent/dashboard", icon: <IconGrid /> },
  { label: "Кошелёк", href: "/respondent/wallet", icon: <IconWallet /> },
  { label: "Профиль", href: "/respondent/profile", icon: <IconUser /> },
];

export default function RespondentLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell roleLabel="Кабинет респондента" nav={nav}>
      {children}
    </DashboardShell>
  );
}

