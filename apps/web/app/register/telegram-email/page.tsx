"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useEffect } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { FieldInput } from "@/components/auth/form-field";
import { OtpInput } from "@/components/shared/OtpInput";
import { Button } from "@/components/ui/button";
import {
  useTelegramEmailRequest,
  useTelegramEmailVerify,
  useTelegramLogin,
} from "@/lib/api/queries";
import { setSession, ROLE_HOME } from "@/lib/auth/session-store";
import type { Role } from "@/lib/api/types";

const EmailSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export default function TelegramEmailPage() {
  const router = useRouter();
  const requestEmail = useTelegramEmailRequest();
  const verifyEmail = useTelegramEmailVerify();
  const telegramLogin = useTelegramLogin();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!sessionStorage.getItem("telegram-new-user")) {
      router.replace("/login");
      return;
    }
    setUserId(sessionStorage.getItem("telegram-user-id") ?? "");
    setReady(true);
  }, [router]);

  const emailForm = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: EmailSchema },
    onSubmit: async ({ value }) => {
      setEmail(value.email);
      requestEmail.mutate(
        { userId, email: value.email },
        {
          onSuccess: () => setStep("otp"),
        },
      );
    },
  });

  const handleVerify = async () => {
    verifyEmail.mutate(
      { userId, email, otp },
      {
        onSuccess: () => {
          telegramLogin.mutate(
            { userId },
            {
              onSuccess: (loginData) => {
                const data = loginData.data;
                const role = (data.role ?? "CUSTOMER") as Role;
                setSession({
                  name: data.name,
                  email: data.email,
                  role,
                  image: data.image ?? null,
                  emailVerified: data.emailVerified ?? false,
                });
                sessionStorage.removeItem("telegram-new-user");
                sessionStorage.removeItem("telegram-user-id");
                router.replace(ROLE_HOME[role]);
              },
            },
          );
        },
      },
    );
  };

  const handleResend = () => {
    requestEmail.mutate({ userId, email });
  };

  if (!ready) return null;

  return (
      <AuthShell>
        <div className="space-y-6">
          {step === "email" && (
            <>
              <div className="space-y-1 text-center">
                <h1 className="text-xl font-bold">Tambahkan Email</h1>
                <p className="text-sm text-muted-foreground">
                  Masukkan email Anda untuk menyelesaikan pendaftaran
                </p>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void emailForm.handleSubmit();
                }}
              >
                <emailForm.Field name="email">
                  {(field) => (
                    <FieldInput
                      field={field}
                      label="Email"
                      type="email"
                      placeholder="nama@email.com"
                      autoComplete="email"
                    />
                  )}
                </emailForm.Field>

                <emailForm.Subscribe
                  selector={(state) => ({
                    isSubmitting: state.isSubmitting,
                    isValid: state.isValid,
                  })}
                >
                  {({ isSubmitting, isValid }) => (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || !isValid || requestEmail.isPending}
                    >
                      {requestEmail.isPending ? "Mengirim…" : "Kirim Kode Verifikasi"}
                    </Button>
                  )}
                </emailForm.Subscribe>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="space-y-1 text-center">
                <h1 className="text-xl font-bold">Verifikasi Email</h1>
                <p className="text-sm text-muted-foreground">
                  Masukkan kode 6 digit yang dikirim ke{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="flex justify-center">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  disabled={verifyEmail.isPending}
                />
              </div>

              <Button
                className="w-full"
                disabled={otp.length !== 6 || verifyEmail.isPending}
                onClick={handleVerify}
              >
                {verifyEmail.isPending ? "Memverifikasi…" : "Verifikasi & Selesai"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <button
                  type="button"
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={requestEmail.isPending}
                  onClick={handleResend}
                >
                  {requestEmail.isPending ? "Mengirim…" : "Kirim ulang kode"}
                </button>
              </div>

              <p className="text-center text-sm">
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                >
                  Ganti email
                </button>
              </p>
            </>
          )}
        </div>
      </AuthShell>
  );
}
