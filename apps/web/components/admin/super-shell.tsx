import Link from "next/link";
import { Store, Shirt, Users, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/super/outlets", label: "Outlet", icon: Store },
  { href: "/super/items", label: "Item", icon: Shirt },
  { href: "/super/staff", label: "Staf", icon: Users },
];

export function SuperShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r bg-white md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
            IW
          </span>
          <span className="font-semibold">Super Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-2">
          <Link href="/api/auth/signout">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </Link>
        </div>
      </aside>

      <div className="md:pl-56">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-white px-4 md:hidden">
          <span className="font-semibold">Super Admin</span>
          <nav className="ml-auto flex gap-1">
            {LINKS.map(({ href, label }) => (
              <Link key={href} href={href}>
                <Button variant="ghost" size="sm">
                  {label}
                </Button>
              </Link>
            ))}
          </nav>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
