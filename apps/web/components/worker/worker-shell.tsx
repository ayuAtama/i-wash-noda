"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Inbox, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/jobs/available", label: "Tersedia", icon: Inbox },
  { href: "/jobs/active", label: "Aktif", icon: PackageCheck },
  { href: "/jobs/history", label: "Riwayat", icon: History },
];

export function WorkerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <PackageCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold leading-none">I-Wash</p>
              <p className="text-xs text-muted-foreground">Pekerja</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
