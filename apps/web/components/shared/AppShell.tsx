"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/lib/api/queries";
import { ROLE_HOME, setUnauthenticated, useSession } from "@/lib/auth/session-store";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

function isActive(pathname: string, item: NavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname.startsWith(item.href);
}

function UserMenu() {
  const router = useRouter();
  const session = useSession();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => {
        setUnauthenticated();
        router.replace("/login");
      },
    });
  }

  return (
    <div className="flex items-center gap-3">
      {session.user ? (
        <div className="hidden items-center gap-2 sm:flex">
          <Avatar className="h-8 w-8">
            {session.user.image ? (
              <AvatarImage src={session.user.image} alt={session.user.name ?? ""} />
            ) : null}
            <AvatarFallback>
              {(session.user.name ?? session.user.email).slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-32 truncate text-sm font-medium">
            {session.user.name ?? session.user.email}
          </span>
        </div>
      ) : null}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        disabled={logout.isPending}
        aria-label="Keluar"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AppShell({
  nav,
  variant = "app",
  children,
}: {
  nav: NavItem[];
  variant?: "app" | "admin";
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const session = useSession();
  const homeHref = session.user ? ROLE_HOME[session.user.role] : "/";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href={homeHref} className="text-lg font-bold tracking-tight">
            I-Wash <span className="text-primary">Noda</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {variant === "admin" ? (
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border p-3 lg:flex">
            {nav.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </aside>
        ) : null}

        <main className="flex-1 px-4 py-6 pb-24 lg:px-8">{children}</main>
      </div>

      {variant === "app" ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-border bg-background/95 backdrop-blur">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
            {nav.map((item) => {
              const active = isActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium"
                >
                  <item.icon
                    className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")}
                  />
                  <span className={active ? "text-primary" : "text-muted-foreground"}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
