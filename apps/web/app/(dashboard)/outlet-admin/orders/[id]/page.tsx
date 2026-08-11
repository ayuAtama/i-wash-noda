"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { Order } from "@/types";
import api from "@/lib/api";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.get("/api/").then((r) => r.data),
    retry: false,
  });

  const order = ((data?.data ?? []) as Order[]).find((o) => o.id === params.id);

  const deliverMutation = useMutation({
    mutationFn: () => api.patch(`/api/orders/${params.id}/deliver`),
    onSuccess: () => {
      addToast({ type: "success", title: "Order marked as delivered" });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      router.push("/outlet-admin/orders");
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  if (isLoading) return <PageSpinner />;
  if (!order)
    return (
      <div className="text-center py-12 text-gray-500">Order not found</div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.id.slice(0, 8)}...`}
        description={`Created ${formatDate(order.created_at)}`}
        breadcrumbs={[
          { label: "Orders", href: "/outlet-admin/orders" },
          { label: order.id.slice(0, 8) + "..." },
        ]}
        action={
          order.status === "packed" || order.status === "ready_for_pickup" ? (
            <Button
              onClick={() => deliverMutation.mutate()}
              loading={deliverMutation.isPending}
            >
              Mark as Delivered
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>Order Details</CardHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Source</span>
              <span className="capitalize">
                {order.source?.replace("_", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span>
                {order.user?.name || order.walk_in_customer?.name || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold">
                {formatCurrency(order.total_price || 0)}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>Items</CardHeader>
          {order.items && order.items.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="py-2">{item.item?.name || item.item_id}</td>
                    <td className="py-2 text-center">
                      {item.quantity_initial}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No items</p>
          )}
        </Card>
      </div>
    </div>
  );
}
