"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiResponse } from "@/types";
import api from "@/lib/api";
import PageHeader from "@/components/ui/page-header";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";

interface WorkerOrder {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  items?: { id: string }[];
}

export default function WorkerHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["worker-history"],
    queryFn: () =>
      api
        .get("/api/worker/orders/history")
        .then((r) => r.data as ApiResponse<WorkerOrder[]>),
    retry: false,
  });

  const orders = data?.data ?? [];

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader title="History" description="Your completed orders" />

      {orders.length === 0 ? (
        <EmptyState
          icon="📜"
          title="No history"
          description="You haven't completed any orders yet."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Completed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.items?.length ?? 0} items
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDateTime(order.updated_at || order.created_at)}
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
