"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldInput } from "@/components/auth/form-field";
import { OtpInput } from "@/components/shared/OtpInput";
import { Button } from "@/components/ui/button";
import { useResetConfirm } from "@/lib/api/queries";
import { RequireGuest } from "@/lib/auth/guards";

const ResetSchema = z
  .object({
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const reset = useResetConfirm();
  const [otp, setOtp] = useState("");

  const email =
    typeof window !== "undefined"
      ? (sessionStorage.getItem("reset-email") ?? "")
      : "";

  const form = useForm({
    defaultValues: { password: "", confirmPassword: "" },
    validators: { onSubmit: ResetSchema },
    onSubmit: async ({ value }) => {
      reset.mutate(
        { email, password: value.password, token: otp },
        {
          onSuccess: () => {
            sessionStorage.removeItem("reset-email");
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
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold">Atur Ulang Kata Sandi</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan kode 6 digit dan kata sandi baru Anda
            </p>
          </div>

          <div className="flex justify-center">
            <OtpInput value={otp} onChange={setOtp} disabled={reset.isPending} />
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <form.Field name="password">
              {(field) => (
                <FieldInput
                  field={field}
                  label="Kata sandi baru"
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
                  disabled={isSubmitting || !isValid || otp.length !== 6 || reset.isPending}
                >
                  {reset.isPending ? "Menyimpan…" : "Simpan kata sandi"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Kirim ulang kode
            </Link>
          </p>
        </div>
      </AuthShell>
    </RequireGuest>
  );
}
