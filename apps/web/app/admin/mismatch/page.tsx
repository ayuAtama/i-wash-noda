"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useMismatchList } from "@/lib/api/queries";
import { formatDate, STATION_LABEL } from "@/lib/utils";

type StationFilter = "" | "washing" | "ironing" | "packing";

const FILTERS: { value: StationFilter; label: string }[] = [
  { value: "", label: "Semua" },
  { value: "washing", label: "Cuci" },
  { value: "ironing", label: "Setrika" },
  { value: "packing", label: "Packing" },
];

export default function AdminMismatchPage() {
  const router = useRouter();
  const [station, setStation] = useState<StationFilter>("");
  const { data, isLoading } = useMismatchList(station || undefined);
  const rows = data?.data ?? [];

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Mismatch</h1>
            <p className="text-sm text-muted-foreground">
              Re-input pekerja yang perlu disetujui atau ditolak.
            </p>
          </div>

          <div className="flex gap-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                variant={station === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStation(filter.value)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Tidak ada mismatch</p>
              <p className="text-sm text-muted-foreground">
                Semua re-input cocok dengan data awal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <Card
                  key={`${row.order_id}-${row.station}`}
                  className="cursor-pointer transition-colors hover:border-primary/50"
                  onClick={() =>
                    router.push(`/admin/mismatch/${row.order_id}/${row.station}`)
                  }
                >
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-xs text-muted-foreground">
                        {row.order_id}
                      </p>
                      <Badge variant="secondary">{STATION_LABEL[row.station]}</Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(row.created_at)}
                      </span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
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
