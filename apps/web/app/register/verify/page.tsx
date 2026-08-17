"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { OtpInput } from "@/components/shared/OtpInput";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { Button } from "@/components/ui/button";
import { useResendOtp, useVerify } from "@/lib/api/queries";
import { RequireGuest } from "@/lib/auth/guards";
import { useCooldown } from "@/hooks/use-cooldown";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkToken = searchParams.get("token");

  const [otp, setOtp] = useState("");
  const [email] = useState(() => sessionStorage.getItem("register-email") ?? "");

  const verify = useVerify();
  const resend = useResendOtp();
  const { seconds, isActive, startCooldown } = useCooldown(0);

  function runVerify(token: string, queryToken?: string) {
    verify.mutate(
      { body: queryToken ? {} : { token }, query: queryToken ? { token: queryToken } : {} },
      {
        onSuccess: () => {
          sessionStorage.setItem("register-verified", "1");
          router.push("/register/complete");
        },
      },
    );
  }

  useEffect(() => {
    if (linkToken) runVerify("", linkToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkToken]);

  return (
    <div className="space-y-6">
      <StepIndicator steps={["Email", "Verifikasi", "Lengkapi"]} current={2} />

      <div className="space-y-1 text-center">
        <h1 className="text-xl font-bold">Verifikasi Email</h1>
        <p className="text-sm text-muted-foreground">
          Masukkan kode 6 digit yang dikirim ke{" "}
          <span className="font-medium text-foreground">{email || "email Anda"}</span>
        </p>
      </div>

      <div className="flex justify-center">
        <OtpInput value={otp} onChange={setOtp} disabled={verify.isPending} />
      </div>

      <Button
        className="w-full"
        disabled={otp.length !== 6 || verify.isPending}
        onClick={() => runVerify(otp)}
      >
        {verify.isPending ? "Memverifikasi…" : "Verifikasi"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        {isActive ? (
          <span>Kirim ulang kode dalam {seconds} detik</span>
        ) : (
          <>
            Tidak menerima kode?{" "}
            <button
              type="button"
              className="font-medium text-primary hover:underline disabled:opacity-50"
              disabled={resend.isPending}
              onClick={() => {
                if (!email) return;
                resend.mutate(
                  { email },
                  {
                    onSuccess: () => startCooldown(60),
                  },
                );
              }}
            >
              {resend.isPending ? "Mengirim…" : "Kirim ulang"}
            </button>
          </>
        )}
      </div>

      <p className="text-center text-sm">
        <Link href="/register" className="font-medium text-primary hover:underline">
          Ganti email
        </Link>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <RequireGuest>
      <AuthShell>
        <Suspense fallback={null}>
          <VerifyContent />
        </Suspense>
      </AuthShell>
    </RequireGuest>
  );
}
