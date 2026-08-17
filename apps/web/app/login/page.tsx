"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldInput } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/lib/api/queries";
import { RequireGuest } from "@/lib/auth/guards";
import { ROLE_HOME, setSession } from "@/lib/auth/session-store";
import { SocialAuthButtons } from "@/components/auth/social-buttons";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";

const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: LoginSchema },
    onSubmit: async ({ value }) => {
      login.mutate(value, {
        onSuccess: (data) => {
          setSession({
            name: data.name,
            email: data.email,
            role: data.role,
            image: null,
            emailVerified: true,
          });
          router.replace(ROLE_HOME[data.role]);
        },
      });
    },
  });

  return (
    <RequireGuest>
      <AuthShell>
        <div className="space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold">Masuk</h1>
            <p className="text-sm text-muted-foreground">
              Selamat datang kembali di I-Wash Noda
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field name="email">
              {(field) => (
                <FieldInput
                  field={field}
                  label="Email"
                  type="email"
                  placeholder="nama@email.com"
                  autoComplete="email"
                />
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <FieldInput
                  field={field}
                  label="Kata sandi"
                  type="password"
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                />
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => ({
                isSubmitting: state.isSubmitting,
                isValid: state.isValid,
              })}
            >
              {({ isSubmitting, isValid }) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || !isValid || login.isPending}
                >
                  {login.isPending ? "Memproses…" : "Masuk"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Lupa kata sandi?{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-primary hover:underline"
            >
              Pulihkan di sini
            </Link>
          </p>

          <div className="space-y-2">
            <SocialAuthButtons callbackURL="/" />
            <TelegramLoginButton />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
                <span className="bg-card px-2">atau</span>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link href="/register">Daftar akun baru</Link>
            </Button>
          </div>
        </div>
      </AuthShell>
    </RequireGuest>
  );
}
