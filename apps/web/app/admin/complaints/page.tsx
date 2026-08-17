"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, MessageSquareWarning } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useAdminComplaints, useComplaintAction } from "@/lib/api/queries";

export default function AdminComplaintsPage() {
  const { data, isLoading } = useAdminComplaints();
  const action = useComplaintAction();
  const complaints = data?.data ?? [];

  const [responses, setResponses] = useState<Record<string, string>>({});

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Keluhan</h1>
            <p className="text-sm text-muted-foreground">
              Tangani keluhan dari pelanggan.
            </p>
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : complaints.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <MessageSquareWarning className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Tidak ada keluhan</p>
              <p className="text-sm text-muted-foreground">
                Keluhan baru dari pelanggan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <Card key={complaint.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {complaint.customerName ?? "Pelanggan"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          Pesanan {complaint.orderId}
                        </p>
                      </div>
                      <Badge
                        variant={
                          complaint.status === "resolved"
                            ? "default"
                            : complaint.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {complaint.status}
                      </Badge>
                    </div>

                    <p className="text-sm">{complaint.message}</p>

                    {complaint.imageUrl ? (
                      <div className="relative h-36 w-full overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={complaint.imageUrl}
                          alt="Foto keluhan"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 600px"
                        />
                      </div>
                    ) : null}

                    {complaint.status === "pending" ? (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Balasan ke pelanggan…"
                          value={responses[complaint.id] ?? ""}
                          onChange={(e) =>
                            setResponses((prev) => ({
                              ...prev,
                              [complaint.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            disabled={action.isPending}
                            onClick={() =>
                              action.mutate({
                                complaintId: complaint.id,
                                status: "resolved",
                                adminResponse:
                                  (responses[complaint.id] ?? "").trim() ||
                                  "Terima kasih, keluhan Anda telah kami tindak lanjuti.",
                              })
                            }
                          >
                            {action.isPending ? (
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                            ) : null}
                            Resolve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            disabled={action.isPending}
                            onClick={() =>
                              action.mutate({
                                complaintId: complaint.id,
                                status: "rejected",
                                adminResponse:
                                  (responses[complaint.id] ?? "").trim() ||
                                  "Keluhan ditolak karena tidak memenuhi syarat.",
                              })
                            }
                          >
                            Tolak
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
