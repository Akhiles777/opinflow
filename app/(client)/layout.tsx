import * as React from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { IconChart, IconGrid, IconWallet } from "@/components/ui/icons";

const nav = [
  { label: "Опросы", href: "/client/dashboard", icon: <IconGrid /> },
  { label: "Аналитика", href: "/client/analytics", icon: <IconChart /> },
  { label: "Кошелёк", href: "/client/wallet", icon: <IconWallet /> },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell roleLabel="Кабинет заказчика" nav={nav}>
      {children}
    </DashboardShell>
  );
}

