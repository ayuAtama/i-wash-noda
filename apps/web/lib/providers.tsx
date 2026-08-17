"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/endpoints";
import { setSession, setUnauthenticated } from "@/lib/auth/session-store";
import { authClient } from "@/lib/auth-client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const { data: baSession } = await authClient.getSession();
        if (!active) return;

        if (baSession?.user) {
          const user = baSession.user as typeof baSession.user & { role?: string };
          setSession({
            name: user.name,
            email: user.email,
            role: (user.role ?? "customer") as never,
            image: user.image ?? null,
            emailVerified: user.emailVerified ?? false,
          });
          return;
        }
      } catch {
        // Better Auth session not available, fall through to /api/me
      }

      try {
        const res = await authApi.me();
        if (!active) return;
        setSession({
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          image: res.data.image,
          emailVerified: res.data["email verified"],
        });
      } catch {
        if (!active) return;
        setUnauthenticated();
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}
