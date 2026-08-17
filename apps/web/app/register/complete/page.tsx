"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldInput } from "@/components/auth/form-field";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { useCompleteRegister } from "@/lib/api/queries";
import { RequireGuest } from "@/lib/auth/guards";
import { validateIndonesianPhone } from "@/lib/utils";

const CompleteSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    phone: z
      .string()
      .refine(
        (v) => v === "" || validateIndonesianPhone(v),
        "Format nomor HP tidak valid (contoh: 081234567890)",
      ),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export default function CompleteRegisterPage() {
  const router = useRouter();
  const complete = useCompleteRegister();

  const email =
    typeof window !== "undefined"
      ? (sessionStorage.getItem("register-email") ?? "")
      : "";

  const form = useForm({
    defaultValues: { name: "", phone: "", password: "", confirmPassword: "" },
    validators: { onSubmit: CompleteSchema },
    onSubmit: async ({ value }) => {
      complete.mutate(
        {
          email,
          name: value.name,
          password: value.password,
          phone: value.phone || undefined,
        },
        {
          onSuccess: () => {
            sessionStorage.removeItem("register-email");
            sessionStorage.removeItem("register-verified");
            router.replace("/login");
          },
        },
      );
    },
  });

  return (
    <RequireGuest>
      <AuthShell>
        <div className="space-y-6">
          <StepIndicator steps={["Email", "Verifikasi", "Lengkapi"]} current={3} />

          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold">Lengkapi Data</h1>
            <p className="text-sm text-muted-foreground">
              Akun {email ? <span className="font-medium">{email}</span> : null}
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
            <form.Field name="name">
              {(field) => (
                <FieldInput
                  field={field}
                  label="Nama lengkap"
                  placeholder="Nama Anda"
                  autoComplete="name"
                />
              )}
            </form.Field>

            <form.Field name="phone">
              {(field) => (
                <FieldInput
                  field={field}
                  label="Nomor HP (opsional)"
                  type="tel"
                  placeholder="081234567890"
                  autoComplete="tel"
                />
              )}
            </form.Field>

            <form.Field name="password">
              {(field) => (
                <FieldInput
                  field={field}
                  label="Kata sandi"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                />
              )}
            </form.Field>

            <form.Field name="confirmPassword">
              {(field) => (
                <FieldInput
                  field={field}
                  label="Konfirmasi kata sandi"
                  type="password"
                  placeholder="Ulangi kata sandi"
                  autoComplete="new-password"
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
                  disabled={isSubmitting || !isValid || complete.isPending}
                >
                  {complete.isPending ? "Mendaftar…" : "Selesai & Masuk"}
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
