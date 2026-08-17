"use client";

import Link from "next/link";
import { History, Loader2, MessageSquareWarning, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerShell } from "@/components/customer/customer-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useCustomerCompletedOrders, useMarkDone } from "@/lib/api/queries";
import type { CustomerOrder } from "@/lib/api/types";
import { formatDate, formatIDR, labelFrom, ORDER_STATUS_LABEL } from "@/lib/utils";

function CompletedOrderCard({ order }: { order: CustomerOrder }) {
  const markDone = useMarkDone();
  const isFinished = order.status === "finished";

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold">Pesanan {order.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground">
              Selesai {formatDate(order.confirmed_at ?? order.updated_at)}
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

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/pickup">
              <RefreshCcw className="mr-1 h-3.5 w-3.5" />
              Pesan lagi
            </Link>
          </Button>
          {isFinished ? (
            <Button asChild variant="ghost" size="sm" className="flex-1">
              <Link href={`/order/${order.id}/complaint`}>
                <MessageSquareWarning className="mr-1 h-3.5 w-3.5" />
                Komplain
              </Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrderCompletePage() {
  const { data, isLoading } = useCustomerCompletedOrders();
  const orders = data?.data ?? [];

  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-bold">Riwayat Pesanan</h1>

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <History className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Belum ada pesanan selesai</p>
                  <p className="text-sm text-muted-foreground">
                    Pesanan yang telah selesai akan tampil di sini.
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
                <CompletedOrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
