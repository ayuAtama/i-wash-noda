"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import StatusBadge from "@/components/ui/status-badge";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import PageHeader from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { formatDate, formatCurrency } from "@/lib/utils";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "arrived_at_outlet", label: "Arrived" },
  { value: "washing_in_progress", label: "Washing" },
  { value: "washing_completed", label: "Washed" },
  { value: "ironing_in_progress", label: "Ironing" },
  { value: "ironing_completed", label: "Ironed" },
  { value: "packing_in_progress", label: "Packing" },
  { value: "packed", label: "Packed" },
  { value: "ready_for_pickup", label: "Ready" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function CustomerOrdersPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: () => api.get("/api/").then((r) => r.data),
    retry: false,
  });

  const orders = (data?.data ?? []).filter(
    (o: any) => !statusFilter || o.status === statusFilter,
  );

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="My Orders"
        description="View and track all your laundry orders"
      />

      <div className="mb-4 max-w-xs">
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          placeholder="Filter by status"
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders found"
          description="You haven't placed any orders yet."
          action={
            <Link href="/customer/pickup-requests/new">
              <Button>New Pickup Request</Button>
            </Link>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="font-mono text-xs text-primary-600 hover:underline"
                    >
                      {order.id.slice(0, 8)}...
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.items?.length ?? 0} items
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(order.total_price || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
