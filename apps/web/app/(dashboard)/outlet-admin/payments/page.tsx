"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.get("/api/").then((r) => r.data),
    retry: false,
  });

  const orders = (data?.data ?? []).filter(
    (o: any) => o.payment_proof || o.status === "pending_payment",
  );

  const confirmMutation = useMutation({
    mutationFn: (orderId: string) =>
      api.patch(`/api/admin/orders/${orderId}/payment-confirm`),
    onSuccess: () => {
      addToast({ type: "success", title: "Payment confirmed" });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: any) => {
      addToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ orderId, note }: { orderId: string; note: string }) =>
      api.patch(`/api/admin/orders/${orderId}/payment-reject`, { note }),
    onSuccess: () => {
      addToast({ type: "success", title: "Payment rejected" });
      setRejectModal(null);
      setRejectNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Review and manage payment proofs"
      />

      {orders.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No pending payments"
          description="All payments are up to date."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-gray-500">
                      {order.id.slice(0, 8)}...
                    </span>
                    <StatusBadge
                      status={order.payment_proof?.status || "pending"}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    Customer:{" "}
                    {order.user?.name || order.walk_in_customer?.name || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {order.payment_proof?.image_url && (
                    <a
                      href={order.payment_proof.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="sm">
                        View Proof
                      </Button>
                    </a>
                  )}
                  <Button
                    size="sm"
                    onClick={() => confirmMutation.mutate(order.id)}
                    loading={confirmMutation.isPending}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRejectModal(order.id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Reject Payment"
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Reason"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Why is this payment being rejected?"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setRejectModal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                rejectModal &&
                rejectMutation.mutate({
                  orderId: rejectModal,
                  note: rejectNote,
                })
              }
              loading={rejectMutation.isPending}
            >
              Reject Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
