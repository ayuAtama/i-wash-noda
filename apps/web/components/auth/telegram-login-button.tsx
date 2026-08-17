"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
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

            const { data: session } = await authClient.getSession();
            if (!session?.user) {
              toast.error("Sesi tidak ditemukan");
              return;
            }

            const user = session.user as typeof session.user & { role?: string };
            const email = user.email ?? null;

            if (email && email.endsWith("@telegram.user")) {
              sessionStorage.setItem("telegram-new-user", "true");
              sessionStorage.setItem("telegram-user-id", user.id as string);
              router.push("/register/telegram-email");
              return;
            }

            const role = ((user.role ?? "CUSTOMER") as Role);
            setSession({
              name: user.name,
              email: user.email,
              role,
              image: user.image ?? null,
              emailVerified: user.emailVerified ?? false,
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
