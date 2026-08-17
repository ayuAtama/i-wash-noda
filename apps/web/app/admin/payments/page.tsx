"use client";

import Image from "next/image";
import { Loader2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useAdminPaymentProofs, usePaymentProofAction } from "@/lib/api/queries";

export default function AdminPaymentsPage() {
  const { data, isLoading } = useAdminPaymentProofs();
  const action = usePaymentProofAction();
  const proofs = data?.data ?? [];

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-4xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Bukti Pembayaran</h1>
            <p className="text-sm text-muted-foreground">
              Periksa dan setujui bukti pembayaran pelanggan.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          ) : proofs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Tidak ada bukti pembayaran</p>
              <p className="text-sm text-muted-foreground">
                Bukti pembayaran dari pelanggan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {proofs.map((proof) => (
                <Card key={proof.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {proof.customerName ?? "Pelanggan"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Pesanan {proof.orderId}
                        </p>
                      </div>
                      <Badge
                        variant={
                          proof.approved === "approved"
                            ? "default"
                            : proof.approved === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {proof.approved === "approved"
                          ? "Disetujui"
                          : proof.approved === "rejected"
                            ? "Ditolak"
                            : "Menunggu"}
                      </Badge>
                    </div>

                    <p className="text-xl font-bold tabular-nums">
                      Rp {proof.totalAmount.toLocaleString("id-ID")}
                    </p>

                    <div className="relative h-44 w-full overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={proof.imageProofUrl}
                        alt="Bukti pembayaran"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>

                    {proof.approved === "pending" ? (
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          disabled={action.isPending}
                          onClick={() =>
                            action.mutate({ id: proof.id, action: "approved" })
                          }
                        >
                          {action.isPending ? (
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Setujui
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          disabled={action.isPending}
                          onClick={() =>
                            action.mutate({ id: proof.id, action: "rejected" })
                          }
                        >
                          Tolak
                        </Button>
                      </div>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground">
                        Diproses {proof.updatedAt && `pada ${proof.updatedAt}`}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
