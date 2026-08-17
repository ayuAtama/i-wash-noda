"use client";

import Link from "next/link";
import { Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusStepper } from "@/components/shared/StatusStepper";
import { CustomerShell } from "@/components/customer/customer-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useCustomerActiveOrders, useMarkDone } from "@/lib/api/queries";
import type { CustomerOrder } from "@/lib/api/types";
import { formatDate, formatIDR, labelFrom, ORDER_STATUS_LABEL } from "@/lib/utils";

function OrderCard({ order }: { order: CustomerOrder }) {
  const markDone = useMarkDone();

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold">Pesanan {order.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">
              Dibuat {formatDate(order.created_at)}
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {labelFrom(ORDER_STATUS_LABEL, order.status)}
          </span>
        </div>

        <div className="rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Berat</span>
            <span className="font-medium">{order.total_kilo} kg</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Cuci</span>
            <span className="font-medium">{formatIDR(order.laundry_price)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Jemput</span>
            <span className="font-medium">{formatIDR(order.pickup_fee)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Antar</span>
            <span className="font-medium">{formatIDR(order.delivery_fee)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>{formatIDR(order.total_amount)}</span>
          </div>
        </div>

        {order.status === "waiting_for_payment" ? (
          <Button asChild className="w-full">
            <Link href={`/order/${order.id}/payment`}>Bayar sekarang</Link>
          </Button>
        ) : null}

        {order.status === "delivered" ? (
          <Button
            className="w-full"
            onClick={() => markDone.mutate(order.id)}
            disabled={markDone.isPending}
          >
            {markDone.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Konfirmasi pesanan diterima
          </Button>
        ) : null}

        <StatusStepper currentStatus={order.status} />
      </CardContent>
    </Card>
  );
}

export default function OrderPage() {
  const { data, isLoading, isFetching } = useCustomerActiveOrders();
  const orders = data?.data ?? [];

  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Pesanan Aktif</h1>
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <PackageCheck className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Tidak ada pesanan aktif</p>
                  <p className="text-sm text-muted-foreground">
                    Pesan jemputan laundry dan pantau progresnya di sini.
                  </p>
                </div>
                <Button asChild>
                  <Link href="/pickup">Pesan jemputan</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}

          <div className="text-center">
            <Button asChild variant="link">
              <Link href="/order/complete">Riwayat pesanan selesai</Link>
            </Button>
          </div>
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
