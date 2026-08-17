"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Package,
  Shirt,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Pesanan", icon: Package },
  { href: "/admin/payments", label: "Pembayaran", icon: CreditCard },
  { href: "/admin/complaints", label: "Keluhan", icon: Wallet },
  { href: "/admin/mismatch", label: "Mismatch", icon: AlertTriangle },
  { href: "/admin/walk-in", label: "Walk-in", icon: UserPlus },
  { href: "/admin/schedule", label: "Jadwal", icon: CalendarDays },
  { href: "/admin/staff", label: "Staf", icon: Users },
  { href: "/admin/items", label: "Item", icon: Shirt },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-muted/30 md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LayoutDashboard className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">I-Wash Admin</p>
            <p className="text-xs text-muted-foreground">Outlet</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {LINKS.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <div className="mx-auto flex h-14 max-w-md items-center gap-1 overflow-x-auto px-4">
            {LINKS.map((link) => {
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
