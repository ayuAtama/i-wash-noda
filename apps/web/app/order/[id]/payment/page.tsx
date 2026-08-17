"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Banknote, CheckCircle2, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { CustomerShell } from "@/components/customer/customer-shell";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useCancelPayment,
  usePaymentGateway,
  useSetPaymentMethod,
  useUploadPaymentProof,
} from "@/lib/api/queries";

export default function PaymentPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const router = useRouter();

  const [method, setMethod] = useState<"manual" | "payment_gateway" | null>(null);
  const [proofUrl, setProofUrl] = useState<string>("");

  const setPaymentMethod = useSetPaymentMethod();
  const cancelPayment = useCancelPayment();
  const uploadProof = useUploadPaymentProof();

  const gateway = usePaymentGateway(orderId, method === "payment_gateway");

  useEffect(() => {
    if (method === "payment_gateway" && !gateway.isLoading && !gateway.isError) {
      if (gateway.data?.data.redirect_url) {
        window.location.href = gateway.data.data.redirect_url;
      }
    }
  }, [method, gateway.isLoading, gateway.isError, gateway.data]);

  const chooseGateway = () => {
    setMethod("payment_gateway");
    setPaymentMethod.mutate({ orderId, paymentMethod: "payment_gateway" });
  };

  const chooseManual = () => {
    setMethod("manual");
    setPaymentMethod.mutate({ orderId, paymentMethod: "manual" });
  };

  const submitting = setPaymentMethod.isPending || uploadProof.isPending || gateway.isLoading;

  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/order">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali ke pesanan
              </Link>
            </Button>
            <h1 className="text-xl font-bold">Pembayaran</h1>
            <p className="text-sm text-muted-foreground">
              Pesanan {orderId.slice(0, 8)} — pilih metode pembayaran Anda.
            </p>
          </div>

          {method === null ? (
            <div className="space-y-3">
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-semibold">Pembayaran Instan</p>
                      <p className="text-sm text-muted-foreground">
                        Bayar lewat gerbang pembayaran (kartu, e-wallet, QRIS).
                      </p>
                    </div>
                  </div>
                  <Button onClick={chooseGateway} disabled={submitting}>
                    Pilih
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <Banknote className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-semibold">Transfer Manual</p>
                      <p className="text-sm text-muted-foreground">
                        Transfer ke rekening outlet, lalu unggah bukti pembayaran.
                      </p>
                    </div>
                  </div>
                  <Button onClick={chooseManual} disabled={submitting}>
                    Pilih
                  </Button>
                </CardContent>
              </Card>
              <p className="text-center text-xs text-muted-foreground">
                Sudah salah pilih?{" "}
                <Button
                  variant="link"
                  className="h-auto p-0"
                  disabled={cancelPayment.isPending}
                  onClick={() => cancelPayment.mutate(orderId)}
                >
                  Batalkan pembayaran
                </Button>
              </p>
            </div>
          ) : null}

          {method === "payment_gateway" ? (
            <Card>
              <CardContent className="space-y-4 p-4">
                <p className="font-semibold">Mengalihkan ke pembayaran instan…</p>
                {gateway.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Membuat transaksi pembayaran…
                  </div>
                ) : gateway.data?.data.redirect_url ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Jika Anda tidak dialihkan otomatis, klik tombol di bawah.
                    </p>
                    <Button
                      className="w-full"
                      onClick={() =>
                        (window.location.href = gateway.data!.data.redirect_url!)
                      }
                    >
                      Lanjut ke pembayaran
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-destructive">
                    Gagal membuat pembayaran instan. Silakan coba metode transfer
                    manual.
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMethod(null)}
                  disabled={submitting}
                >
                  Ubah metode
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {method === "manual" ? (
            <Card>
              <CardContent className="space-y-4 p-4">
                <div>
                  <p className="font-semibold">Transfer Manual</p>
                  <p className="text-sm text-muted-foreground">
                    Silakan transfer sejumlah tagihan ke rekening outlet, lalu unggah
                    bukti pembayaran di bawah ini. Bukti akan diverifikasi oleh admin
                    outlet.
                  </p>
                </div>

                <div className="rounded-lg border border-dashed p-4">
                  <ImageUpload
                    folder="payment-proofs"
                    value={proofUrl}
                    onUploaded={setProofUrl}
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={!proofUrl || submitting}
                  onClick={() =>
                    uploadProof.mutate(
                      { orderId, urlProof: proofUrl },
                      { onSuccess: () => router.push("/order") },
                    )
                  }
                >
                  {uploadProof.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Saya sudah bayar
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMethod(null)}
                  disabled={submitting}
                >
                  Ubah metode
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
