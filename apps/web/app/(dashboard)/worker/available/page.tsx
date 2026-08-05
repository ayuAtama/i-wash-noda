"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils";

export default function WorkerAvailablePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["worker-available"],
    queryFn: () => api.get("/api/worker/orders/available").then((r) => r.data),
    retry: false,
  });

  const orders = data?.data ?? [];

  const acceptMutation = useMutation({
    mutationFn: (orderId: string) =>
      api.post(`/api/worker/orders/${orderId}/accept`),
    onSuccess: () => {
      addToast({ type: "success", title: "Order accepted" });
      queryClient.invalidateQueries({ queryKey: ["worker-available"] });
      queryClient.invalidateQueries({ queryKey: ["worker-in-progress"] });
      router.push("/worker/in-progress");
    },
    onError: (err: any) => {
      addToast({
        type: "error",
        title: "Failed to accept",
        message: err.response?.data?.message,
      });
    },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="Available Orders"
        description="Accept orders at your station"
      />

      {orders.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No available orders"
          description="There are no orders waiting at your station."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-gray-600 mb-1">
                    Order {order.id.slice(0, 8)}...
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.items?.length ?? 0} items
                    {order.notes && ` · ${order.notes}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>
                <Button
                  onClick={() => acceptMutation.mutate(order.id)}
                  loading={acceptMutation.isPending}
                >
                  Accept Order
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
