"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DriverShell } from "@/components/driver/driver-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useDeliveryActive } from "@/lib/api/queries";

const STATUS_LABEL: Record<string, string> = {
  in_transit: "Menuju pelanggan",
  on_delivery: "Mengantarkan",
  done: "Selesai",
};

export default function ActiveDeliveriesPage() {
  const router = useRouter();
  const { data, isLoading } = useDeliveryActive();
  const jobs = data?.data ?? [];

  return (
    <RequireAuth>
      <DriverShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Antaran Aktif</h1>
            <Button asChild variant="ghost" size="sm">
              <Link href="/jobs/delivery/history">Riwayat</Link>
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                <PackageOpen className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Belum ada antaran aktif</p>
                <p className="text-sm text-muted-foreground">
                  Terima antaran dari daftar untuk mulai bekerja.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-2">
                  <Link href="/jobs/delivery">Lihat antaran tersedia</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer transition-colors hover:border-primary/50"
                  onClick={() => router.push(`/jobs/delivery/${job.id}`)}
                >
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold">{job.customer ?? "Pelanggan"}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.deliveryAddress ?? "-"}
                      </p>
                      <span className="text-xs font-medium text-primary">
                        {STATUS_LABEL[job.status] ?? job.status}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DriverShell>
    </RequireAuth>
  );
}
