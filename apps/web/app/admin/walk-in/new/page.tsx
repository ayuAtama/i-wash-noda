"use client";

import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { AdminShell } from "@/components/admin/admin-shell";
import { FieldInput } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RequireAuth } from "@/lib/auth/guards";
import { useCreateWalkIn } from "@/lib/api/queries";
import { validateIndonesianPhone } from "@/lib/utils";

const WalkInSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z
    .string()
    .refine(validateIndonesianPhone, "Format nomor HP tidak valid (contoh: 081234567890)"),
});

export default function NewWalkInPage() {
  const router = useRouter();
  const create = useCreateWalkIn();

  const form = useForm({
    defaultValues: { name: "", phone: "" },
    validators: { onSubmit: WalkInSchema },
    onSubmit: async ({ value }) => {
      create.mutate(
        { name: value.name.trim(), phone: value.phone.trim() },
        { onSuccess: () => router.push("/admin/walk-in") },
      );
    },
  });

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-md space-y-4">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/admin/walk-in">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Kembali
            </Link>
          </Button>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <h1 className="text-lg font-bold">Pelanggan Baru</h1>
                <p className="text-sm text-muted-foreground">
                  Buat pelanggan walk-in baru.
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
                      label="Nama"
                      placeholder="Nama pelanggan"
                    />
                  )}
                </form.Field>

                <form.Field name="phone">
                  {(field) => (
                    <FieldInput
                      field={field}
                      label="Nomor HP"
                      type="tel"
                      placeholder="081234567890"
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
                      {create.isPending ? "Menyimpan…" : "Simpan"}
                    </Button>
                  )}
                </form.Subscribe>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
