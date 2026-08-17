"use client";

import Link from "next/link";
import { CheckCheck, MapPin, Navigation, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DriverShell } from "@/components/driver/driver-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useAcceptDelivery, useDeliveryAvailable } from "@/lib/api/queries";

export default function DeliveryJobsPage() {
  const { data, isLoading } = useDeliveryAvailable();
  const accept = useAcceptDelivery();

  const jobs = data ?? [];

  return (
    <RequireAuth>
      <DriverShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Antaran Tersedia</h1>
            <div className="flex gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link href="/jobs/delivery/active">Aktif</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/jobs/delivery/history">Riwayat</Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
                <CheckCheck className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium">Tidak ada antaran tersedia</p>
                <p className="text-sm text-muted-foreground">
                  Antaran baru akan muncul di sini secara otomatis.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="flex items-center gap-2 font-semibold">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {job.customer_name}
                        </p>
                        <p className="flex items-start gap-1 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          {job.customer_address}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {job.created_at}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={job.gmap_link} target="_blank" rel="noreferrer">
                          <Navigation className="mr-1 h-3.5 w-3.5" />
                          Rute
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={accept.isPending}
                        onClick={() => accept.mutate(job.id)}
                      >
                        Terima antaran
                      </Button>
                    </div>
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
