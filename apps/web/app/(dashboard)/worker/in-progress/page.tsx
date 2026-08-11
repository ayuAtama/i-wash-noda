"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@/types";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

interface WorkerOrderItem {
  id: string;
  item_id: string;
  quantity_initial: number;
  item?: { name?: string };
}

interface WorkerOrder {
  id: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: WorkerOrderItem[];
}

export default function WorkerInProgressPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: availableData, isLoading } = useQuery({
    queryKey: ["worker-available"],
    queryFn: () =>
      api
        .get("/api/worker/orders/available")
        .then((r) => r.data as ApiResponse<WorkerOrder[]>),
    retry: false,
  });

  const { data: historyData } = useQuery({
    queryKey: ["worker-history"],
    queryFn: () =>
      api
        .get("/api/worker/orders/history")
        .then((r) => r.data as ApiResponse<WorkerOrder[]>),
    retry: false,
  });

  const available = availableData?.data ?? [];
  const history = historyData?.data ?? [];

  const completedIds = new Set(history.map((h) => h.id));
  const inProgressOrders = available.filter((o) => !completedIds.has(o.id));

  const completeMutation = useMutation({
    mutationFn: (orderId: string) =>
      api.post(`/api/worker/orders/${orderId}/complete`),
    onSuccess: () => {
      addToast({ type: "success", title: "Order completed" });
      queryClient.invalidateQueries({ queryKey: ["worker-available"] });
      queryClient.invalidateQueries({ queryKey: ["worker-history"] });
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

  return (
    <div>
      <PageHeader
        title="In Progress"
        description="Your currently processing orders"
      />

      {inProgressOrders.length === 0 ? (
        <EmptyState
          icon="⚙️"
          title="No orders in progress"
          description="Accept an order from the available queue."
          action={
            <Button onClick={() => router.push("/worker/available")}>
              View Available
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {inProgressOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>Order {order.id.slice(0, 8)}...</CardHeader>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Items:
                  </p>
                  {order.items && order.items.length > 0 ? (
                    <ul className="space-y-1">
                      {order.items.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-600 flex justify-between"
                        >
                          <span>{item.item?.name || item.item_id}</span>
                          <span className="text-gray-400">
                            ×{item.quantity_initial}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">No items listed</p>
                  )}
                </div>
                {order.notes && (
                  <p className="text-sm text-gray-500 italic">
                    Note: {order.notes}
                  </p>
                )}
                <div className="pt-2">
                  <Button
                    onClick={() => completeMutation.mutate(order.id)}
                    loading={completeMutation.isPending}
                  >
                    Mark Complete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
