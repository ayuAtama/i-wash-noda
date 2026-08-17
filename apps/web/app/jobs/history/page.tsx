"use client";

import { History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkerShell } from "@/components/worker/worker-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useWorkerCompleted } from "@/lib/api/queries";
import { formatDate } from "@/lib/utils";

export default function WorkerHistoryPage() {
  const { data, isLoading } = useWorkerCompleted();
  const jobs = data?.data ?? [];

  return (
    <RequireAuth>
      <WorkerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-bold">Riwayat Pekerjaan</h1>

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                <History className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Belum ada riwayat pekerjaan</p>
                <p className="text-sm text-muted-foreground">
                  Pekerjaan yang sudah selesai akan muncul di sini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-semibold">{job.customerName}</p>
                      <p className="text-xs text-muted-foreground">{job.id}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(job.completedAt)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </WorkerShell>
    </RequireAuth>
  );
}
