"use client";

import { CalendarDays, Package, Truck } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shared/AppShell";

const nav: NavItem[] = [
  { href: "/jobs/pickup", label: "Jemput", icon: Truck },
  { href: "/jobs/delivery", label: "Antar", icon: Package },
  { href: "/schedule", label: "Jadwal", icon: CalendarDays },
];

export function DriverShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={nav} variant="app">
      {children}
    </AppShell>
  );
}
