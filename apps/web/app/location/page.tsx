"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LocateFixed, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerShell } from "@/components/customer/customer-shell";
import { LocationPicker, type LatLng } from "@/components/customer/location-picker";
import { OutletCard, OutletCardSkeleton } from "@/components/customer/outlet-card";
import { RequireAuth } from "@/lib/auth/guards";
import { useOutletCoverage } from "@/lib/api/queries";
import { useGeolocation } from "@/hooks/use-geolocation";
import { reverseGeocode } from "@/lib/location/actions";

export default function LocationPage() {
  const router = useRouter();
  const { position, approximate, error, loading, locate } = useGeolocation();
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (position) setCoords(position);
  }, [position]);

  useEffect(() => {
    let cancelled = false;
    if (!coords) {
      setAddress(null);
      return;
    }
    setGeocoding(true);
    reverseGeocode(coords.lat, coords.lng)
      .then((result) => {
        if (!cancelled) setAddress(result?.formatted ?? null);
      })
      .catch(() => {
        if (!cancelled) setAddress(null);
      })
      .finally(() => {
        if (!cancelled) setGeocoding(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  const coverage = useOutletCoverage(coords?.lat ?? 0, coords?.lng ?? 0, Boolean(coords));
  const coveredOutlets = coverage.data?.data ?? [];

  const handleConfirm = useCallback(() => {
    if (!coords) return;
    sessionStorage.setItem(
      "pickup-location",
      JSON.stringify({ lat: coords.lat, lng: coords.lng, address }),
    );
    router.push("/pickup");
  }, [coords, address, router]);

  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl space-y-5">
          <div>
            <h1 className="text-xl font-bold">Pilih Lokasi</h1>
            <p className="text-sm text-muted-foreground">
              Geser pin untuk menyesuaikan titik penjemputan Anda.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <LocationPicker value={coords} onChange={setCoords} height={320} />
          </div>

          <Button variant="outline" onClick={locate} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="mr-2 h-4 w-4" />
            )}
            Gunakan lokasi saat ini
          </Button>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {approximate ? (
            <p className="flex items-start gap-1 text-sm text-muted-foreground">
              <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              Lokasi diperkirakan dari koneksi internet Anda — geser pin untuk
              menyesuaikan.
            </p>
          ) : null}

          {coords ? (
            <Card>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start gap-2">
                  <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {geocoding
                        ? "Mencari alamat…"
                        : address ?? "Alamat tidak ditemukan"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {coords ? (
            <div>
              <h2 className="mb-2 text-base font-semibold">Cek jangkauan</h2>
              {coverage.isLoading ? (
                <div className="space-y-3">
                  <OutletCardSkeleton />
                </div>
              ) : coveredOutlets.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="font-medium">Belum ada outlet di area ini</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kami belum menjangkau lokasi tersebut. Coba geser pin ke lokasi
                      lain.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {coveredOutlets.map((outlet) => (
                    <OutletCard key={outlet.id} outlet={outlet} />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          <Button
            size="lg"
            className="w-full"
            disabled={!coords || coveredOutlets.length === 0}
            onClick={handleConfirm}
          >
            Konfirmasi lokasi & lanjut
          </Button>
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
