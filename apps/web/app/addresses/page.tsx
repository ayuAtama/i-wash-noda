"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { CustomerShell } from "@/components/customer/customer-shell";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/lib/api/queries";

function AddressList() {
  const router = useRouter();
  const { data, isLoading } = useAddresses();
  const removeAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [toDelete, setToDelete] = useState<string | null>(null);

  const addresses = data ?? [];
  const target = addresses.find((address) => address.id === toDelete);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">Belum ada alamat tersimpan</p>
          <p className="text-sm text-muted-foreground">
            Tambahkan alamat pertama Anda untuk memesan jemputan laundry.
          </p>
          <Button asChild className="mt-2">
            <Link href="/addresses/new">
              <Plus className="mr-2 h-4 w-4" />
              Tambah alamat
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <Card key={address.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{address.label ?? "Alamat"}</p>
                  {address.is_default ? (
                    <Badge className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Utama
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{address.address}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ubah alamat"
                  onClick={() => router.push(`/addresses/${address.id}`)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus alamat"
                  disabled={removeAddress.isPending}
                  onClick={() => setToDelete(address.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            {!address.is_default ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={setDefault.isPending}
                onClick={() => setDefault.mutate(address.id)}
              >
                Jadikan alamat utama
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => {
          if (!open) setToDelete(null);
        }}
        title="Hapus alamat?"
        description={
          target
            ? `Alamat "${target.label ?? target.address}" akan dihapus secara permanen.`
            : "Alamat ini akan dihapus secara permanen."
        }
        confirmLabel="Hapus"
        onConfirm={() => {
          if (toDelete) removeAddress.mutate(toDelete);
          setToDelete(null);
        }}
      />
    </div>
  );
}

export default function AddressesPage() {
  return (
    <RequireAuth>
      <CustomerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Buku Alamat</h1>
              <p className="text-sm text-muted-foreground">
                Kelola alamat untuk penjemputan dan pengantaran.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/addresses/new">
                <Plus className="mr-1 h-4 w-4" />
                Tambah
              </Link>
            </Button>
          </div>
          <AddressList />
        </div>
      </CustomerShell>
    </RequireAuth>
  );
}
