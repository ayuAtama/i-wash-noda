"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, UserPlus, UserRound, PackagePlus, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useDeleteWalkIn,
  useSearchWalkIn,
  useUpdateWalkIn,
} from "@/lib/api/queries";
import { useDebounce } from "@/hooks/use-debounce";
import type { WalkInCustomer } from "@/lib/api/types";

export default function AdminWalkInPage() {
  const [keyword, setKeyword] = useState("");
  const debounced = useDebounce(keyword.trim(), 350);
  const { data, isFetching } = useSearchWalkIn(debounced, debounced.length > 0);
  const remove = useDeleteWalkIn();
  const update = useUpdateWalkIn();

  const [editing, setEditing] = useState<WalkInCustomer | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const customers = data?.data ?? [];

  const openEdit = (customer: WalkInCustomer) => {
    setEditing(customer);
    setEditName(customer.name);
    setEditPhone(customer.phone);
  };

  const saveEdit = () => {
    if (!editing) return;
    update.mutate(
      { id: editing.id, body: { name: editName.trim(), phone: editPhone.trim() } },
      { onSuccess: () => setEditing(null) },
    );
  };

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">Pelanggan Walk-in</h1>
              <p className="text-sm text-muted-foreground">
                Cari pelanggan walk-in untuk dibuatkan pesanan manual.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/admin/walk-in/new">
                <UserPlus className="mr-1 h-4 w-4" />
                Tambah
              </Link>
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari nama atau nomor HP…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {isFetching ? (
            <Skeleton className="h-32 w-full" />
          ) : debounced.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <UserRound className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Cari pelanggan untuk mulai</p>
              <p className="text-sm text-muted-foreground">
                Hasil pencarian akan muncul di sini.
              </p>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <Search className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Pelanggan tidak ditemukan</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/admin/walk-in/new">Buat pelanggan baru</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <Card key={customer.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {customer.created_at}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        asChild
                        variant="default"
                        size="sm"
                        className="flex-1"
                      >
                        <Link
                          href={`/admin/orders/manual/${customer.id}?name=${encodeURIComponent(customer.name)}`}
                        >
                          <PackagePlus className="mr-1 h-4 w-4" />
                          Buat pesanan
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(customer)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={remove.isPending}
                          >
                            Hapus
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus pelanggan ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {customer.name} ({customer.phone}) akan dihapus. Tindakan
                              ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => remove.mutate(customer.id)}
                            >
                              Hapus
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

        <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit pelanggan walk-in</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Nama</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Nomor HP</Label>
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditing(null)}
              >
                Batal
              </Button>
              <Button
                disabled={update.isPending || !editName.trim() || !editPhone.trim()}
                onClick={saveEdit}
              >
                {update.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminShell>
    </RequireAuth>
  );
}
