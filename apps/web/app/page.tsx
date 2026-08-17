"use client";

import Link from "next/link";
import { Loader2, LocateFixed, MapPinned, PackageCheck, Shirt, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerShell } from "@/components/customer/customer-shell";
import { OutletCard, OutletCardSkeleton } from "@/components/customer/outlet-card";
import { useOutletCoverage, useOutlets } from "@/lib/api/queries";
import { useGeolocation } from "@/hooks/use-geolocation";

export default function HomePage() {
  const { position, approximate, error, loading, locate } = useGeolocation();
  const coverage = useOutletCoverage(position?.lat ?? 0, position?.lng ?? 0, Boolean(position));
  const outlets = useOutlets();
  const coveredOutlets = coverage.data?.data ?? [];

  const allOutlets = coveredOutlets.length > 0 ? coveredOutlets : (outlets.data?.data ?? []);

  return (
    <CustomerShell>
      <section className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 text-center sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            I-Wash <span className="text-primary">Noda</span>
          </h1>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Cuci, setrika, dan antar pulang. Driver kami menjemput pakaian kotor Anda,
            dan mengantarnya kembali dalam keadaan bersih dan harum.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={locate} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="mr-2 h-4 w-4" />
              )}
              Deteksi lokasi saya
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/location">
                <MapPinned className="mr-2 h-4 w-4" />
                Pilih lokasi di peta
              </Link>
            </Button>
          </div>

          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}

          {approximate ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Lokasi diperkirakan dari koneksi internet Anda — Anda tetap bisa
              menyesuaikannya di peta.
            </p>
          ) : null}
        </div>

        {position ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Outlet di sekitar Anda</h2>
              <span className="text-sm text-muted-foreground">
                {coverage.isLoading
                  ? "Menghitung…"
                  : `${coveredOutlets.length} outlet tersedia`}
              </span>
            </div>

            {coverage.isLoading ? (
              <div className="space-y-3">
                <OutletCardSkeleton />
                <OutletCardSkeleton />
              </div>
            ) : coveredOutlets.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="font-medium">Belum ada outlet di area Anda</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Saat ini kami belum menjangkau lokasi Anda. Cobalah memilih lokasi
                    lain di peta, atau hubungi kami untuk info lebih lanjut.
                  </p>
                  <Button asChild variant="outline" className="mt-4">
                    <Link href="/location">Ubah lokasi</Link>
                  </Button>
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
        ) : (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Outlet kami</h2>
              <Link href="/location" className="text-sm text-primary hover:underline">
                Cek jangkauan
              </Link>
            </div>
            {outlets.isLoading ? (
              <div className="space-y-3">
                <OutletCardSkeleton />
                <OutletCardSkeleton />
              </div>
            ) : (
              <div className="space-y-3">
                {allOutlets.map((outlet) => (
                  <OutletCard key={outlet.id} outlet={outlet} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Cara kerjanya</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardContent className="space-y-2 p-4">
                <Truck className="h-6 w-6 text-primary" />
                <p className="font-semibold">1. Jemput</p>
                <p className="text-sm text-muted-foreground">
                  Pilih alamat dan outlet terdekat. Driver menjemput pakaian Anda.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-4">
                <Shirt className="h-6 w-6 text-primary" />
                <p className="font-semibold">2. Cuci & setrika</p>
                <p className="text-sm text-muted-foreground">
                  Pakaian dicuci, disetrika, dan dipacking oleh pekerja kami.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-2 p-4">
                <PackageCheck className="h-6 w-6 text-primary" />
                <p className="font-semibold">3. Antar pulang</p>
                <p className="text-sm text-muted-foreground">
                  Pesanan diantar kembali ke alamat Anda setelah selesai.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="rounded-2xl border p-5 text-center sm:p-6">
          <h2 className="text-lg font-semibold">Sudah siap laundry?</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Tarif dihitung dari berat pakaian dan jarak tempuh. Pembayaran dilakukan
            setelah pesanan selesai dicuci.
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/pickup">Mulai Pesan Jemputan</Link>
          </Button>
        </div>
      </section>
    </CustomerShell>
  );
}
