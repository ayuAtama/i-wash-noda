"use client";

import { Home, MapPin, NotebookPen, PackageSearch, User } from "lucide-react";
import { AppShell, type NavItem } from "@/components/shared/AppShell";

const nav: NavItem[] = [
  { href: "/", label: "Beranda", icon: Home, exact: true },
  { href: "/addresses", label: "Alamat", icon: MapPin },
  { href: "/pickup", label: "Jemput", icon: NotebookPen },
  { href: "/order", label: "Pesanan", icon: PackageSearch },
  { href: "/profile", label: "Profil", icon: User },
];

export function CustomerShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell nav={nav} variant="app">
      {children}
    </AppShell>
  );
}
