"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerShell } from "@/components/customer/customer-shell";
import { AddressForm } from "@/components/customer/address-form";
import { RequireAuth } from "@/lib/auth/guards";
import { useAddresses } from "@/lib/api/queries";

export default function EditAddressPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useAddresses();
  const addresses = data ?? [];
  const address = addresses.find((item) => item.id === params.id);

  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-5 text-xl font-bold">Ubah Alamat</h1>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : address ? (
            <AddressForm address={address} />
          ) : (
            <div className="space-y-2 py-10 text-center">
              <p className="font-medium">Alamat tidak ditemukan</p>
              <p className="text-sm text-muted-foreground">
                Alamat yang Anda cari mungkin sudah dihapus.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/addresses">Kembali ke buku alamat</Link>
              </Button>
            </div>
          )}
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
