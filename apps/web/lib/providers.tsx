"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/endpoints";
import { setSession, setUnauthenticated } from "@/lib/auth/session-store";

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

    authApi
      .me()
      .then((res) => {
        if (!active) return;
        setSession({
          name: res.data.name,
          email: res.data.email,
          role: res.data.role,
          image: res.data.image,
          emailVerified: res.data["email verified"],
        });
      })
      .catch(() => {
        if (!active) return;
        setUnauthenticated();
      });

    return () => {
      active = false;
    };
  }, []);

  return <>{children}</>;
}
