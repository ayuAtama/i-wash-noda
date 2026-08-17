"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StepIndicator } from "@/components/shared/StepIndicator";
import { CustomerShell } from "@/components/customer/customer-shell";
import { OutletCard, OutletCardSkeleton } from "@/components/customer/outlet-card";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useAddresses,
  useCreatePickupRequest,
  useCustomerActiveOrders,
  useOutletCoverage,
} from "@/lib/api/queries";

const STEPS = ["Alamat", "Outlet", "Tinjau"];

function PickupFlow() {
  const [step, setStep] = useState(1);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [outletId, setOutletId] = useState<string | null>(null);

  const { data: addressesData, isLoading: addressesLoading } = useAddresses();
  const { data: activeData } = useCustomerActiveOrders();
  const createPickup = useCreatePickupRequest();

  const addresses = useMemo(() => addressesData ?? [], [addressesData]);
  const activeOrders = useMemo(() => activeData?.data ?? [], [activeData]);
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === addressId) ?? null,
    [addresses, addressId],
  );

  const coverage = useOutletCoverage(
    selectedAddress?.lat ?? 0,
    selectedAddress?.lng ?? 0,
    Boolean(selectedAddress),
  );
  const coveredOutlets = coverage.data?.data ?? [];

  const submit = () => {
    if (!addressId || !outletId) return;
    createPickup.mutate(
      { addressId, outletId },
      {
        onSuccess: () => setStep(4),
      },
    );
  };

  if (activeOrders.length > 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <PackageCheck className="h-10 w-10 text-primary" />
          <div>
            <p className="font-semibold">Anda sudah memiliki pesanan aktif</p>
            <p className="text-sm text-muted-foreground">
              Selesaikan pesanan yang sedang berjalan sebelum mengajukan jemputan baru.
            </p>
          </div>
          <Button asChild>
            <Link href="/order">Lihat pesanan saya</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 4) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <div>
            <p className="text-lg font-bold">Permintaan jemputan terkirim!</p>
            <p className="text-sm text-muted-foreground">
              Driver akan segera menghubungi Anda untuk menjemput pakaian.
            </p>
          </div>
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/order">Lacak pesanan</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (addressesLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-semibold">Belum ada alamat tersimpan</p>
          <p className="text-sm text-muted-foreground">
            Tambahkan alamat terlebih dahulu sebelum memesan jemputan.
          </p>
          <Button asChild>
            <Link href="/addresses/new?next=/pickup">Tambah alamat</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <StepIndicator steps={STEPS} current={step} />

      {step === 1 ? (
        <div className="space-y-3">
          <h2 className="font-semibold">Pilih alamat penjemputan</h2>
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={addressId === address.id ? "border-primary ring-1 ring-primary" : ""}
            >
              <CardContent className="p-4">
                <p className="font-semibold">{address.label ?? "Alamat"}</p>
                <p className="text-sm text-muted-foreground">{address.address}</p>
                <Button
                  className="mt-3"
                  size="sm"
                  variant={addressId === address.id ? "default" : "outline"}
                  onClick={() => setAddressId(address.id)}
                >
                  {addressId === address.id ? "Dipilih" : "Pilih"}
                </Button>
              </CardContent>
            </Card>
          ))}
          <Button asChild variant="link" className="px-0">
            <Link href="/addresses/new?next=/pickup">+ Tambah alamat baru</Link>
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pilih outlet terdekat</h2>
            <span className="text-sm text-muted-foreground">
              {coverage.isLoading
                ? "Menghitung jarak…"
                : `Jarak dari ${selectedAddress?.label ?? "alamat"}`}
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
                <p className="font-medium">Tidak ada outlet yang menjangkau alamat ini</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Coba pilih alamat lain atau ubah titik lokasi penjemputan.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setStep(1)}>
                  Pilih alamat lain
                </Button>
              </CardContent>
            </Card>
          ) : (
            coveredOutlets.map((outlet) => (
              <OutletCard
                key={outlet.id}
                outlet={outlet}
                selected={outletId === outlet.id}
                onSelect={() => setOutletId(outlet.id)}
              />
            ))
          )}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <h2 className="font-semibold">Tinjau pesanan</h2>
          <Card>
            <CardContent className="space-y-3 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Alamat jemput</span>
                <span className="text-right font-medium">
                  {selectedAddress?.label} — {selectedAddress?.address}
                </span>
              </div>
              {coveredOutlets.find((outlet) => outlet.id === outletId) ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Outlet</span>
                  <span className="text-right font-medium">
                    {coveredOutlets.find((outlet) => outlet.id === outletId)?.name}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Biaya pengantaran</span>
                <span className="font-medium">Dihitung saat penjemputan</span>
              </div>
              <div className="border-t pt-3 text-xs text-muted-foreground">
                <p>
                  Tarif akhir dihitung setelah pakaian ditimbang di outlet (harga per
                  kg + biaya perjalanan). Anda akan melihat rinciannya sebelum
                  pembayaran.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="flex gap-3">
        {step > 1 && step < 4 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={createPickup.isPending}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
        ) : null}
        {step === 1 ? (
          <Button
            className="flex-1"
            disabled={!addressId}
            onClick={() => setStep(2)}
          >
            Lanjut pilih outlet
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
        {step === 2 ? (
          <Button
            className="flex-1"
            disabled={!outletId || coveredOutlets.length === 0}
            onClick={() => setStep(3)}
          >
            Tinjau pesanan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : null}
        {step === 3 ? (
          <Button className="flex-1" onClick={submit} disabled={createPickup.isPending}>
            {createPickup.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Kirim permintaan jemputan
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default function PickupPage() {
  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-5 text-xl font-bold">Pesan Jemputan</h1>
          <PickupFlow />
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
