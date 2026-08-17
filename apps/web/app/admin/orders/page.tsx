"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useAdminOrders } from "@/lib/api/queries";
import { formatDate } from "@/lib/utils";

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data, isLoading } = useAdminOrders();
  const orders = data?.data ?? [];

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Pesanan</h1>
              <p className="text-sm text-muted-foreground">
                Pesanan yang sudah tiba di outlet.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/walk-in">Buat manual</Link>
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <Package className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Belum ada pesanan</p>
              <p className="text-sm text-muted-foreground">
                Pesanan yang tiba di outlet akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right">Kg</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status Bayar</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">
                        {order.customer_name ?? "-"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">
                        {order.pickupAddress?.address ?? "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {order.total_kilo}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        Rp {order.total_amount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={order.paid ? "default" : "secondary"}>
                          {order.paid ? "Lunas" : "Belum bayar"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
