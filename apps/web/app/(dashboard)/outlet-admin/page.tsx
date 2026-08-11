"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { Order, Mismatch } from "@/types";
import api from "@/lib/api";
import StatCard from "@/components/ui/stat-card";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function OutletAdminDashboard() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.get("/api/").then((r) => r.data),
    retry: false,
  });

  const { data: mismatchData } = useQuery({
    queryKey: ["admin-mismatches"],
    queryFn: () => api.get("/api/admin/mismatch").then((r) => r.data),
    retry: false,
  });

  const orders = (ordersData?.data ?? []) as Order[];
  const mismatches = (mismatchData?.data ?? []) as Mismatch[];
  const pendingMismatches = mismatches.filter((m) => m.status === "pending");

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outlet Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage orders, walk-ins, and payments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Orders"
          value={orders.length}
          icon={<span className="text-xl">📦</span>}
        />
        <StatCard
          label="Pending Mismatches"
          value={pendingMismatches.length}
          icon={<span className="text-xl">⚠️</span>}
        />
        <StatCard
          label="Ready for Delivery"
          value={orders.filter((o) => o.status === "ready_for_pickup").length}
          icon={<span className="text-xl">✅</span>}
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(
            orders.reduce((s: number, o: Order) => s + (o.total_price || 0), 0),
          )}
          icon={<span className="text-xl">💰</span>}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/outlet-admin/walk-ins/new">
          <Button>New Walk-in</Button>
        </Link>
        <Link href="/outlet-admin/orders">
          <Button variant="outline">View Orders</Button>
        </Link>
        <Link href="/outlet-admin/payments">
          <Button variant="outline">Payments</Button>
        </Link>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Orders
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-500">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Source</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-3">
                    <Link
                      href={`/outlet-admin/orders/${order.id}`}
                      className="font-mono text-xs text-primary-600 hover:underline"
                    >
                      {order.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-3 text-gray-500 capitalize">
                    {order.source?.replace("_", " ")}
                  </td>
                  <td className="py-3 text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(order.total_price || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
