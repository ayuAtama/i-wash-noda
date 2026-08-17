"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useMismatchDetail, useManageMismatch } from "@/lib/api/queries";
import { STATION_LABEL } from "@/lib/utils";

const STATIONS = ["washing", "ironing", "packing"] as const;

interface RowState {
  itemId: string;
  decision: "approved" | "rejected";
  latestQuantity: number;
  adminNote: string;
}

export default function AdminMismatchDetailPage() {
  const params = useParams<{ orderId: string; station: string }>();
  const router = useRouter();
  const { orderId, station } = params;

  const validStation = STATIONS.includes(station as (typeof STATIONS)[number])
    ? (station as (typeof STATIONS)[number])
    : null;

  const { data, isLoading } = useMismatchDetail(orderId, station as (typeof STATIONS)[number]);
  const manage = useManageMismatch();

  const detail = data?.data;
  const mismatchItems = detail?.mismatch ?? [];

  const [rows, setRows] = useState<RowState[] | null>(null);

  const effectiveRows: RowState[] =
    rows ??
    mismatchItems.map((item) => ({
      itemId: item.itemId,
      decision: "approved",
      latestQuantity: item.quantityInput,
      adminNote: "",
    }));

  const updateRow = (itemId: string, patch: Partial<RowState>) => {
    setRows((prev) =>
      (prev ?? mismatchItems.map((item) => ({
        itemId: item.itemId,
        decision: "approved",
        latestQuantity: item.quantityInput,
        adminNote: "",
      }))).map((row) =>
        row.itemId === itemId ? { ...row, ...patch } : row,
      ),
    );
  };

  const expectedByItem = new Map(
    (detail?.expectedItems ?? []).map((item) => [item.itemId, item.expectedQuantity]),
  );

  const handleSave = () => {
    if (effectiveRows.length === 0 || !validStation) return;
    manage.mutate(
      {
        orderId,
        stationName: validStation,
        body: {
          finalQuantities: effectiveRows.map((row) => ({
            itemId: row.itemId,
            latestQuantity: row.latestQuantity,
          })),
          itemDecisions: effectiveRows.map((row) => ({
            itemId: row.itemId,
            status: row.decision,
            ...(row.adminNote.trim() ? { adminNote: row.adminNote.trim() } : {}),
          })),
        },
      },
      {
        onSuccess: () => {
          router.push("/admin/mismatch");
        },
      },
    );
  };

  if (!validStation) {
    return (
      <RequireAuth>
        <AdminShell>
          <div className="mx-auto max-w-3xl py-10 text-center">
            <p className="font-medium">Stasiun tidak valid</p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link href="/admin/mismatch">Kembali</Link>
            </Button>
          </div>
        </AdminShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/admin/mismatch">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <Badge variant="secondary">{STATION_LABEL[validStation]}</Badge>
          </div>

          <div>
            <h1 className="text-xl font-bold">Detail Mismatch</h1>
            <p className="truncate text-sm text-muted-foreground">{orderId}</p>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : mismatchItems.length === 0 ? (
            <div className="rounded-lg border p-10 text-center">
              <p className="font-medium">Data mismatch tidak ditemukan</p>
            </div>
          ) : (
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Ekspektasi</TableHead>
                        <TableHead className="text-right">Re-input</TableHead>
                        <TableHead className="text-right">Selisih</TableHead>
                        <TableHead className="text-right">Qty Final</TableHead>
                        <TableHead>Keputusan</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mismatchItems.map((item) => {
                        const row = effectiveRows.find(
                          (r) => r.itemId === item.itemId,
                        );
                        const expected = expectedByItem.get(item.itemId) ?? 0;
                        const diff = item.quantityInput - expected;
                        return (
                          <TableRow key={item.itemId}>
                            <TableCell className="font-medium">
                              {item.itemName}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {expected}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {item.quantityInput}
                            </TableCell>
                            <TableCell
                              className={
                                diff === 0
                                  ? "text-right tabular-nums text-muted-foreground"
                                  : "text-right font-semibold tabular-nums text-amber-600"
                              }
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                min={1}
                                max={100}
                                className="ml-auto h-8 w-20 text-right"
                                value={row?.latestQuantity ?? item.quantityInput}
                                onChange={(e) =>
                                  updateRow(item.itemId, {
                                    latestQuantity:
                                      e.target.value === ""
                                        ? 1
                                        : Number(e.target.value),
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={
                                    row?.decision === "approved"
                                      ? "default"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    updateRow(item.itemId, {
                                      decision: "approved",
                                    })
                                  }
                                >
                                  Setuju
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={
                                    row?.decision === "rejected"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  onClick={() =>
                                    updateRow(item.itemId, {
                                      decision: "rejected",
                                    })
                                  }
                                >
                                  Tolak
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Textarea
                                className="h-9 min-h-9 resize-none text-xs"
                                placeholder="Catatan admin…"
                                value={row?.adminNote ?? ""}
                                onChange={(e) =>
                                  updateRow(item.itemId, {
                                    adminNote: e.target.value,
                                  })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/admin/mismatch">Batal</Link>
                  </Button>
                  <Button
                    size="sm"
                    disabled={manage.isPending}
                    onClick={handleSave}
                  >
                    {manage.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Simpan keputusan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
