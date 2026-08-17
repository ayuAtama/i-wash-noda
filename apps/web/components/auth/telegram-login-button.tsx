"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { authApi } from "@/lib/api/endpoints";
import { setSession, ROLE_HOME } from "@/lib/auth/session-store";
import type { Role } from "@/lib/api/types";

export function TelegramLoginButton({
  callbackURL = "/",
}: {
  callbackURL?: string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    authClient
      .initTelegramWidget(
        "telegram-login-widget",
        { size: "large", showUserPhoto: true },
        async (authData) => {
          setLoading(true);
          try {
            const result = await authClient.signInWithTelegram(authData);
            if (result.error) {
              toast.error(
                result.error.message || "Gagal masuk dengan Telegram"
              );
              return;
            }

            const sessionData = result.data as { user: Record<string, unknown>; session: Record<string, unknown> } | null;
            if (!sessionData?.user) {
              toast.error("Sesi tidak ditemukan");
              return;
            }

            const user = sessionData.user;
            const email = (user.email as string) ?? null;
            const userId = user.id as string;

            if (email && email.endsWith("@telegram.user")) {
              sessionStorage.setItem("telegram-new-user", "true");
              sessionStorage.setItem("telegram-user-id", userId);
              router.push("/register/telegram-email");
              return;
            }

            const loginResult = await authApi.telegramLogin({ userId });
            const data = loginResult.data;
            const role = (data.role ?? "CUSTOMER") as Role;
            setSession({
              name: data.name,
              email: data.email,
              role,
              image: data.image ?? null,
              emailVerified: data.emailVerified ?? false,
            });
            router.replace(
              callbackURL.startsWith("http")
                ? "/"
                : callbackURL || ROLE_HOME[role]
            );
          } catch {
            toast.error("Gagal masuk dengan Telegram");
          } finally {
            setLoading(false);
          }
        },
      )
      .catch((err) => {
        console.error("Telegram widget init failed:", err);
      });
  }, [router, callbackURL]);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/80">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div
        id="telegram-login-widget"
        ref={containerRef}
        className="flex justify-center"
      />
    </div>
  );
}
