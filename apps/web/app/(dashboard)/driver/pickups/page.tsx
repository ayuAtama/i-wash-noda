"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ApiResponse, PickupRequest } from "@/types";
import api from "@/lib/api";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

type Tab = "available" | "accepted" | "completed";

export default function DriverPickupsPage() {
  const [tab, setTab] = useState<Tab>("available");
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["driver-pickups"],
    queryFn: () =>
      api
        .get("/api/pickup-requests")
        .then((r) => r.data as ApiResponse<PickupRequest[]>),
    retry: false,
  });

  const pickups = data?.data ?? [];
  const filtered = pickups.filter((p) => {
    if (tab === "available") return p.status === "pending";
    if (tab === "accepted") return p.status === "accepted";
    return p.status === "picked_up";
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/pickup-requests/${id}/accept`),
    onSuccess: () => {
      addToast({ type: "success", title: "Pickup accepted" });
      queryClient.invalidateQueries({ queryKey: ["driver-pickups"] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  const pickupMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/pickup-requests/${id}/next`),
    onSuccess: () => {
      addToast({ type: "success", title: "Marked as picked up" });
      queryClient.invalidateQueries({ queryKey: ["driver-pickups"] });
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
      count: pickups.filter((p) => p.status === "pending").length,
    },
    {
      key: "accepted",
      label: "In Progress",
      count: pickups.filter((p) => p.status === "accepted").length,
    },
    {
      key: "completed",
      label: "Completed",
      count: pickups.filter((p) => p.status === "picked_up").length,
    },
  ];

  return (
    <div>
      <PageHeader title="Pickups" description="Manage pickup requests" />

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
          icon="📦"
          title={`No ${tab} pickups`}
          description="Nothing to show here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((pickup) => (
            <Card key={pickup.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-gray-500">
                      {pickup.id.slice(0, 8)}...
                    </span>
                    <StatusBadge status={pickup.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    Outlet: {pickup.outlet?.name || pickup.outlet_id}
                  </p>
                  {pickup.address && (
                    <p className="text-xs text-gray-500 mt-1">
                      Address:{" "}
                      {typeof pickup.address === "string"
                        ? pickup.address
                        : pickup.address.address}
                    </p>
                  )}
                  {pickup.pickup_date && (
                    <p className="text-xs text-gray-500">
                      Date: {formatDate(pickup.pickup_date)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {tab === "available" && (
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(pickup.id)}
                      loading={acceptMutation.isPending}
                    >
                      Accept
                    </Button>
                  )}
                  {tab === "accepted" && (
                    <Button
                      size="sm"
                      onClick={() => pickupMutation.mutate(pickup.id)}
                      loading={pickupMutation.isPending}
                    >
                      Mark Picked Up
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
