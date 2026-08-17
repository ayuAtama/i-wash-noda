"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldInput } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { useResetRequest } from "@/lib/api/queries";
import { RequireGuest } from "@/lib/auth/guards";

const ForgotSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const reset = useResetRequest();

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: ForgotSchema },
    onSubmit: async ({ value }) => {
      reset.mutate(
        { email: value.email },
        {
          onSuccess: () => {
            sessionStorage.setItem("reset-email", value.email);
            router.push("/reset-password");
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
            <h1 className="text-xl font-bold">Lupa Kata Sandi</h1>
            <p className="text-sm text-muted-foreground">
              Masukkan email Anda, kami akan mengirimkan kode verifikasi
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
                  disabled={isSubmitting || !isValid || reset.isPending}
                >
                  {reset.isPending ? "Mengirim…" : "Kirim kode"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Ingat kata sandi?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Kembali ke login
            </Link>
          </p>
        </div>
      </AuthShell>
    </RequireGuest>
  );
}
