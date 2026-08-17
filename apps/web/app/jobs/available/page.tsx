"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkerShell } from "@/components/worker/worker-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useWorkerAvailable } from "@/lib/api/queries";
import { labelFrom, ORDER_SOURCE_LABEL } from "@/lib/utils";

export default function WorkerAvailablePage() {
  const router = useRouter();
  const { data, isLoading } = useWorkerAvailable();
  const jobs = data?.data ?? [];

  return (
    <RequireAuth>
      <WorkerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-bold">Pekerjaan Tersedia</h1>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                <Inbox className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Tidak ada pekerjaan tersedia</p>
                <p className="text-sm text-muted-foreground">
                  Pekerjaan baru akan muncul di sini secara otomatis.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold">{job.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.id}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {labelFrom(ORDER_SOURCE_LABEL, job.source)}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      className="shrink-0"
                      onClick={() => router.push(`/jobs/${job.id}/process`)}
                    >
                      Proses
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Jadwal shift Anda belum tersedia otomatis. Lihat di{" "}
            <Link href="/schedule" className="underline">
              jadwal shift
            </Link>
            .
          </p>
        </div>
      </WorkerShell>
    </RequireAuth>
  );
}
