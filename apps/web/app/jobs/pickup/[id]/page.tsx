"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  MapPin,
  Navigation,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapView } from "@/components/shared/MapView";
import { DriverShell } from "@/components/driver/driver-shell";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useAcceptPickup,
  usePickupActive,
  usePickupAvailable,
  usePickupNextStatus,
} from "@/lib/api/queries";
import type { ActivePickupJob, PickupRequestJob } from "@/lib/api/types";
import { parseCoordinates } from "@/lib/utils";

export default function PickupJobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const { data: availableData, isLoading: availableLoading } = usePickupAvailable();
  const { data: activeData, isLoading: activeLoading } = usePickupActive();
  const accept = useAcceptPickup();
  const next = usePickupNextStatus();

  const available = availableData?.data ?? [];
  const active = activeData?.data ?? [];

  const availableJob = available.find((job) => job.id === jobId) ?? null;
  const activeJob = active.find((job) => job.id === jobId) ?? null;

  const loading = availableLoading || activeLoading;

  if (loading) {
    return (
      <RequireAuth>
        <DriverShell>
          <div className="mx-auto max-w-2xl">
            <Skeleton className="h-72 w-full" />
          </div>
        </DriverShell>
      </RequireAuth>
    );
  }

  if (!availableJob && !activeJob) {
    return (
      <RequireAuth>
        <DriverShell>
          <div className="mx-auto max-w-2xl space-y-3 py-10 text-center">
            <CheckCheck className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Pekerjaan tidak ditemukan atau sudah selesai</p>
            <p className="text-sm text-muted-foreground">
              Pekerjaan ini mungkin sudah diambil driver lain atau sudah selesai.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/jobs/pickup">Kembali ke daftar jemputan</Link>
            </Button>
          </div>
        </DriverShell>
      </RequireAuth>
    );
  }

  const availableJobShape = availableJob as PickupRequestJob | null;
  const activeJobShape = activeJob as ActivePickupJob | null;

  const customerName =
    availableJobShape?.customer_name ?? activeJobShape?.customer?.name ?? "-";
  const customerAddress =
    availableJobShape?.customer_address ??
    activeJobShape?.pickupAddress?.address ??
    "-";
  const coords = availableJobShape
    ? parseCoordinates(availableJobShape.customer_coordinates)
    : activeJobShape?.pickupAddress
      ? parseCoordinates(
          `${activeJobShape.pickupAddress.lat}, ${activeJobShape.pickupAddress.lng}`,
        )
      : null;
  const gmapLink = availableJobShape?.gmap_link ?? null;
  const status = activeJobShape?.status ?? "pending";

  return (
    <RequireAuth>
      <DriverShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/jobs/pickup">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <Badge variant={status === "pending" ? "secondary" : "default"}>
              {status === "pending"
                ? "Menunggu diterima"
                : status === "in_transit"
                  ? "Menuju pelanggan"
                  : status === "on_delivery"
                    ? "Menuju outlet"
                    : status}
            </Badge>
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <p className="flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {customerName}
                </p>
                <p className="flex items-start gap-1 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {customerAddress}
                </p>
              </div>

              {coords ? <MapView lat={coords.lat} lng={coords.lng} /> : null}

              <Button asChild variant="outline" size="sm" className="w-full">
                <a
                  href={gmapLink ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!gmapLink}
                >
                  <Navigation className="mr-1 h-4 w-4" />
                  Buka rute di Google Maps
                </a>
              </Button>

              {status === "pending" ? (
                <Button
                  className="w-full"
                  disabled={accept.isPending}
                  onClick={() => accept.mutate(jobId)}
                >
                  {accept.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Terima jemputan
                </Button>
              ) : status === "in_transit" ? (
                <Button
                  size="lg"
                  className="w-full"
                  disabled={next.isPending}
                  onClick={() => next.mutate(jobId)}
                >
                  {next.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Saya sudah di lokasi pelanggan
                </Button>
              ) : status === "on_delivery" ? (
                <Button
                  size="lg"
                  className="w-full"
                  disabled={next.isPending}
                  onClick={() => next.mutate(jobId)}
                >
                  {next.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Saya sudah sampai di outlet
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Pekerjaan ini sudah selesai.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </DriverShell>
    </RequireAuth>
  );
}
