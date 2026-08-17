"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkerShell } from "@/components/worker/worker-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useWorkerActive, useWorkerMarkDone } from "@/lib/api/queries";
import { labelFrom, ORDER_SOURCE_LABEL } from "@/lib/utils";

export default function WorkerActivePage() {
  const [jobToComplete, setJobToComplete] = useState<string | null>(null);
  const { data, isLoading } = useWorkerActive();
  const markDone = useWorkerMarkDone();
  const jobs = data?.data ?? [];

  return (
    <RequireAuth>
      <WorkerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-bold">Pekerjaan Aktif</h1>

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                <p className="font-medium">Belum ada pekerjaan aktif</p>
                <p className="text-sm text-muted-foreground">
                  Terima pekerjaan dari daftar tersedia untuk mulai bekerja.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/jobs/available">Lihat pekerjaan tersedia</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="font-semibold">{job.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{job.id}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium text-primary">
                        {labelFrom(ORDER_SOURCE_LABEL, job.source)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/jobs/${job.id}/process`}>Re-input</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => setJobToComplete(job.id)}
                          >
                            Tandai selesai
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Selesaikan pekerjaan?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tandai pekerjaan ini selesai. Item dengan re-input
                              yang masih menunggu persetujuan admin akan diblokir.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              disabled={markDone.isPending}
                              onClick={() => {
                                if (jobToComplete) markDone.mutate(jobToComplete);
                                setJobToComplete(null);
                              }}
                            >
                              {markDone.isPending ? "Memproses…" : "Selesaikan"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
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
