"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@/lib/api/types";
import { ROLE_HOME, useSession } from "./session-store";

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: readonly Role[];
}) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (session.status === "authenticated" && roles && session.user) {
      const allowed = roles.includes(session.user.role);
      if (!allowed) router.replace(ROLE_HOME[session.user.role]);
    }
  }, [session.status, session.user, roles, router]);

  if (session.status !== "authenticated" || !session.user) return <Splash />;

  if (roles && session.user && !roles.includes(session.user.role)) {
    return <Splash />;
  }

  return <>{children}</>;
}

export function RequireGuest({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === "authenticated" && session.user) {
      router.replace(ROLE_HOME[session.user.role]);
    }
  }, [session.status, session.user, router]);

  if (session.status === "authenticated") return <Splash />;

  return <>{children}</>;
}
