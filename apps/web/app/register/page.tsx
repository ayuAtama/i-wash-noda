"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldInput } from "@/components/auth/form-field";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/lib/api/queries";
import { RequireGuest } from "@/lib/auth/guards";
import { SocialAuthButtons } from "@/components/auth/social-buttons";
import { TelegramLoginButton } from "@/components/auth/telegram-login-button";

const RegisterSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: RegisterSchema },
    onSubmit: async ({ value }) => {
      register.mutate(
        { email: value.email },
        {
          onSuccess: () => {
            sessionStorage.setItem("register-email", value.email);
            router.push("/register/verify");
          },
        },
      );
    },
  });

  return (
    <RequireGuest>
      <AuthShell>
        <div className="space-y-6">
          <StepIndicator steps={["Email", "Verifikasi", "Lengkapi"]} current={1} />

          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold">Daftar Akun</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email Anda untuk memulai pendaftaran
            </p>
          </div>

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
                  disabled={isSubmitting || !isValid || register.isPending}
                >
                  {register.isPending ? "Mengirim…" : "Lanjutkan"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Masuk
            </Link>
          </p>
        </div>
      </AuthShell>
    </RequireGuest>
  );
}
