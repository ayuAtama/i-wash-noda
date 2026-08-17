"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldInput } from "@/components/auth/form-field";
import { FullScreenLoader } from "@/components/shared/BrandLogo";
import { Button } from "@/components/ui/button";
import { useCreateSuperAdmin, useSetupStatus } from "@/lib/api/queries";
import { RequireGuest } from "@/lib/auth/guards";

const SetupSchema = z
  .object({
    email: z.string().email("Email tidak valid"),
    name: z.string().min(2, "Nama minimal 2 karakter"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export default function SetupPage() {
  const router = useRouter();
  const setupStatus = useSetupStatus();
  const create = useCreateSuperAdmin();

  useEffect(() => {
    if (setupStatus.data === false) {
      router.replace("/login");
    }
  }, [setupStatus.data, router]);

  const form = useForm({
    defaultValues: { email: "", name: "", password: "", confirmPassword: "" },
    validators: { onSubmit: SetupSchema },
    onSubmit: async ({ value }) => {
      create.mutate(
        { email: value.email, name: value.name, password: value.password },
        {
          onSuccess: () => {
            router.replace("/login");
          },
        },
      );
    },
  });

  if (setupStatus.isPending) return <FullScreenLoader />;

  return (
    <RequireGuest>
      <AuthShell>
        <div className="space-y-6">
          <div className="space-y-1 text-center">
            <h1 className="text-xl font-bold">Pengaturan Awal</h1>
            <p className="text-sm text-muted-foreground">
              Buat akun Super Admin pertama untuk I-Wash Noda
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
                  placeholder="admin@email.com"
                  autoComplete="email"
                />
              )}
            </form.Field>

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
                  disabled={isSubmitting || !isValid || create.isPending}
                >
                  {create.isPending ? "Membuat…" : "Buat akun Super Admin"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </AuthShell>
    </RequireGuest>
  );
}
