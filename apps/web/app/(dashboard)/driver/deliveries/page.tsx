"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ApiResponse, DeliveryRequest } from "@/types";
import api from "@/lib/api";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

type Tab = "available" | "accepted" | "completed";

export default function DriverDeliveriesPage() {
  const [tab, setTab] = useState<Tab>("available");
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["driver-deliveries"],
    queryFn: () =>
      api
        .get("/api/delivery-requests")
        .then((r) => r.data as ApiResponse<DeliveryRequest[]>),
    retry: false,
  });

  const deliveries = data?.data ?? [];
  const filtered = deliveries.filter((d) => {
    if (tab === "available") return d.status === "pending";
    if (tab === "accepted") return d.status === "accepted";
    return d.status === "completed";
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/delivery-requests/${id}/accept`),
    onSuccess: () => {
      addToast({ type: "success", title: "Delivery accepted" });
      queryClient.invalidateQueries({ queryKey: ["driver-deliveries"] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/delivery-requests/${id}/completed`),
    onSuccess: () => {
      addToast({ type: "success", title: "Delivery completed" });
      queryClient.invalidateQueries({ queryKey: ["driver-deliveries"] });
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

  const tabs: { key: Tab; label: string; count: number }[] = [
    {
      key: "available",
      label: "Available",
      count: deliveries.filter((d) => d.status === "pending").length,
    },
    {
      key: "accepted",
      label: "In Progress",
      count: deliveries.filter((d) => d.status === "accepted").length,
    },
    {
      key: "completed",
      label: "Completed",
      count: deliveries.filter((d) => d.status === "completed").length,
    },
  ];

  return (
    <div>
      <PageHeader title="Deliveries" description="Manage delivery requests" />

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 max-w-md">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🚚"
          title={`No ${tab} deliveries`}
          description="Nothing to show here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((delivery) => (
            <Card key={delivery.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-gray-500">
                      {delivery.id.slice(0, 8)}...
                    </span>
                    <StatusBadge status={delivery.status} />
                  </div>
                  {delivery.order && (
                    <p className="text-sm text-gray-600">
                      Order {delivery.order.id?.slice(0, 8)}... ·{" "}
                      {formatCurrency(delivery.order.total_price || 0)}
                    </p>
                  )}
                  {delivery.delivery_address && (
                    <p className="text-xs text-gray-500 mt-1">
                      To: {delivery.delivery_address}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {tab === "available" && (
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(delivery.id)}
                      loading={acceptMutation.isPending}
                    >
                      Accept
                    </Button>
                  )}
                  {tab === "accepted" && (
                    <Button
                      size="sm"
                      onClick={() => completeMutation.mutate(delivery.id)}
                      loading={completeMutation.isPending}
                    >
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
