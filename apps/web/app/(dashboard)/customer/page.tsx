"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import StatCard from "@/components/ui/stat-card";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function CustomerDashboard() {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: () => api.get("/api/orders").then((r) => r.data),
    retry: false,
  });

  const orderList = orders?.data ?? [];
  const activeOrders = orderList.filter(
    (o: any) => !["delivered", "cancelled"].includes(o.status),
  );
  const recentOrders = orderList.slice(0, 5);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your laundry orders and pickups
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Active Orders"
          value={activeOrders.length}
          icon={<span className="text-xl">📦</span>}
        />
        <StatCard
          label="Total Orders"
          value={orderList.length}
          icon={<span className="text-xl">📋</span>}
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(
            orderList.reduce(
              (s: number, o: any) => s + (o.total_amount || 0),
              0,
            ),
          )}
          icon={<span className="text-xl">💰</span>}
        />
      </div>

      <div className="flex gap-3">
        <Link href="/customer/pickup-requests/new">
          <Button>New Pickup Request</Button>
        </Link>
        <Link href="/customer/orders">
          <Button variant="outline">View All Orders</Button>
        </Link>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Orders
        </h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            No orders yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-3 font-mono text-xs text-gray-600">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatCurrency(order.total_amount || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
