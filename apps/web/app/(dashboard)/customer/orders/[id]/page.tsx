"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@/types";
import api from "@/lib/api";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatCurrency } from "@/lib/utils";
import { loadSnapScript, openSnapEmbed } from "@/lib/midtrans";

const statusSteps = [
  "waiting_for_driver_pickup",
  "out_for_pickup",
  "in_transit_to_outlet",
  "arrived_at_outlet",
  "washing_in_progress",
  "ironing_in_progress",
  "packing_in_progress",
  "waiting_for_payment",
  "waiting_for_driver_deliver",
  "out_for_delivery",
  "delivered",
  "finished",
];

const statusLabels: Record<string, string> = {
  waiting_for_driver_pickup: "Waiting for Driver Pickup",
  out_for_pickup: "Out for Pickup",
  in_transit_to_outlet: "In Transit to Outlet",
  arrived_at_outlet: "Arrived at Outlet",
  washing_in_progress: "Washing",
  ironing_in_progress: "Ironing",
  packing_in_progress: "Packing",
  waiting_for_payment: "Waiting for Payment",
  waiting_for_driver_deliver: "Waiting for Driver Delivery",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  finished: "Finished",
};

interface CustomerOrderItem {
  id: string;
  name: string;
  quantity_initial: number;
}

interface CustomerOrder {
  id: string;
  status: string;
  paid: boolean;
  total_amount: number | null;
  total_price: number | null;
  created_at: string;
  updated_at: string;
  items: CustomerOrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: () =>
      api
        .get("/api/orders")
        .then((r) => r.data as ApiResponse<CustomerOrder[]>),
    retry: false,
  });

  const order = (data?.data ?? []).find((o) => o.id === params.id);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("proof", file);
      return api.post(`/api/orders/${params.id}/payment-proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      addToast({ type: "success", title: "Payment proof uploaded" });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      addToast({
        type: "error",
        title: "Upload failed",
        message: err.response?.data?.message,
      });
    },
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      uploadMutation.mutate(file);
      setUploading(false);
    }
  };

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/api/orders/${params.id}/payment-sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
    },
  });

  const payMutation = useMutation({
    mutationFn: () => api.post(`/api/orders/${params.id}/pay`),
    onSuccess: async (res) => {
      const data = res.data?.data;
      const snapToken = data?.snap_token;
      if (data?.already_paid) {
        addToast({ type: "success", title: "Payment already settled" });
        syncMutation.mutate();
        return;
      }
      if (!snapToken) {
        addToast({
          type: "error",
          title: "Pay failed",
          message: "No snap token returned",
        });
        return;
      }
      try {
        await loadSnapScript();
        setEmbedOpen(true);
        openSnapEmbed(snapToken, "snap-embed-container", {
          onSuccess: () => {
            addToast({ type: "success", title: "Payment successful" });
            syncMutation.mutate();
          },
          onPending: () => {
            addToast({ type: "info", title: "Payment pending" });
            syncMutation.mutate();
          },
          onError: () => {
            addToast({ type: "error", title: "Payment failed" });
          },
          onClose: () => {
            setEmbedOpen(false);
            syncMutation.mutate();
          },
        });
      } catch (err) {
        setEmbedOpen(false);
        addToast({
          type: "error",
          title: "Pay failed",
          message: err instanceof Error ? err.message : "Unexpected error",
        });
      }
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      addToast({
        type: "error",
        title: "Pay failed",
        message: err.response?.data?.message,
      });
    },
  });

  if (isLoading) return <PageSpinner />;
  if (!order)
    return (
      <div className="text-center py-12 text-gray-500">Order not found</div>
    );

  const currentStepIndex = statusSteps.indexOf(order.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.id.slice(0, 8)}...`}
        description={`Created ${formatDate(order.created_at)}`}
        breadcrumbs={[
          { label: "Orders", href: "/customer/orders" },
          { label: order.id.slice(0, 8) + "..." },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Timeline */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Status
          </h3>
          <StatusBadge status={order.status} />
          <div className="mt-6 space-y-0">
            {statusSteps.map((step, i) => {
              const isCompleted =
                i <= currentStepIndex && order.status !== "cancelled";
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex items-start gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${isCompleted ? "bg-primary-600 border-primary-600" : "bg-white border-gray-300"} ${isCurrent ? "ring-2 ring-primary-200" : ""}`}
                    />
                    {i < statusSteps.length - 1 && (
                      <div
                        className={`w-0.5 h-6 ${isCompleted ? "bg-primary-600" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`text-xs -mt-0.5 ${isCompleted ? "text-gray-900 font-medium" : "text-gray-400"}`}
                  >
                    {statusLabels[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            {order.items?.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">Item</th>
                    <th className="pb-2 font-medium text-center">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-50 last:border-0"
                    >
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-center">
                        {item.quantity_initial}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={1} className="py-2 font-semibold text-right">
                      Total
                    </td>
                    <td className="py-2 text-right font-bold">
                      {formatCurrency(order.total_amount || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p className="text-sm text-gray-500">No items</p>
            )}
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <div className="flex flex-wrap gap-3">
              {order.status === "waiting_for_payment" && (
                <Button
                  onClick={() => {
                    setEmbedOpen(true);
                    payMutation.mutate();
                  }}
                  loading={payMutation.isPending}
                >
                  Pay with Midtrans
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                loading={uploading || uploadMutation.isPending}
              >
                Upload Payment Proof
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Upload a screenshot of your payment confirmation, or pay online
              via Midtrans Snap
            </p>
            {embedOpen && (
              <div
                id="snap-embed-container"
                className="mt-4 relative w-full inset-0 rounded-lg border border-gray-200"
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
