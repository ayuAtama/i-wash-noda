"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import StatusBadge from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PageSpinner } from "@/components/ui/spinner";
import EmptyState from "@/components/ui/empty-state";
import Modal from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

export default function MismatchesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [resolveModal, setResolveModal] = useState<{
    id: string;
    action: "approve" | "reject";
  } | null>(null);
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-mismatches"],
    queryFn: () => api.get("/api/admin/mismatch").then((r) => r.data),
    retry: false,
  });

  const mismatches = data?.data ?? [];

  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: string;
      note: string;
    }) => {
      if (action === "approve")
        return api.patch(`/api/admin/mismatch/${id}/approve`, {
          resolution_note: note,
        });
      return api.patch(`/api/admin/mismatch/${id}/reject`, {
        resolution_note: note,
      });
    },
    onSuccess: () => {
      addToast({ type: "success", title: `Mismatch ${resolveModal?.action}d` });
      setResolveModal(null);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["admin-mismatches"] });
    },
    onError: (err: any) => {
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
        title="Mismatches"
        description="Review and resolve order mismatches"
      />

      {mismatches.length === 0 ? (
        <EmptyState
          icon="⚠️"
          title="No mismatches"
          description="No mismatch reports found."
        />
      ) : (
        <div className="space-y-4">
          {mismatches.map((m: any) => (
            <Card key={m.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-gray-500">
                      Order {m.order_id?.slice(0, 8)}...
                    </span>
                    <StatusBadge status={m.status} />
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                      {m.station}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{m.description}</p>
                  {m.resolution_note && (
                    <p className="text-xs text-gray-500 mt-1">
                      Resolution: {m.resolution_note}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(m.created_at)}
                  </p>
                </div>
                {m.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        setResolveModal({ id: m.id, action: "approve" })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setResolveModal({ id: m.id, action: "reject" })
                      }
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!resolveModal}
        onClose={() => setResolveModal(null)}
        title={`${resolveModal?.action === "approve" ? "Approve" : "Reject"} Mismatch`}
        size="sm"
      >
        <div className="space-y-4">
          <Textarea
            label="Resolution Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this resolution..."
          />
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setResolveModal(null)}>
              Cancel
            </Button>
            <Button
              variant={
                resolveModal?.action === "reject" ? "destructive" : "default"
              }
              onClick={() =>
                resolveModal &&
                resolveMutation.mutate({
                  id: resolveModal.id,
                  action: resolveModal.action,
                  note,
                })
              }
              loading={resolveMutation.isPending}
            >
              {resolveModal?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
