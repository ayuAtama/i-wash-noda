"use client";

import { useState } from "react";
import { Loader2, MapPin, Pencil, Plus, Store, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SuperShell } from "@/components/admin/super-shell";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useCreateOutlet,
  useDeleteOutlet,
  useOutlets,
  useUpdateOutlet,
} from "@/lib/api/queries";
import type { Outlet } from "@/lib/api/types";

interface OutletFormState {
  name: string;
  address: string;
  lat: string;
  lng: string;
  max_distance_km: string;
  price_per_km: string;
  price_per_kg: string;
}

const EMPTY: OutletFormState = {
  name: "",
  address: "",
  lat: "",
  lng: "",
  max_distance_km: "",
  price_per_km: "",
  price_per_kg: "",
};

function toForm(outlet: Outlet): OutletFormState {
  return {
    name: outlet.name,
    address: outlet.address,
    lat: String(outlet.lat),
    lng: String(outlet.lng),
    max_distance_km: String(outlet.max_distance_km),
    price_per_km: String(outlet.price_per_km),
    price_per_kg: String(outlet.price_per_kg),
  };
}

function toPayload(form: OutletFormState) {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    lat: Number(form.lat),
    lng: Number(form.lng),
    max_distance_km: Number(form.max_distance_km),
    price_per_km: Number(form.price_per_km),
    price_per_kg: Number(form.price_per_kg),
  };
}

function OutletFields({
  form,
  setForm,
}: {
  form: OutletFormState;
  setForm: (next: OutletFormState) => void;
}) {
  const field = (key: keyof OutletFormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="outlet-name">Nama outlet</Label>
        <Input id="outlet-name" placeholder="I-Wash Noda Surabaya" {...field("name")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="outlet-address">Alamat</Label>
        <Input id="outlet-address" placeholder="Jl. Basin No.789" {...field("address")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="outlet-lat">Latitude</Label>
          <Input id="outlet-lat" placeholder="-7.2575" {...field("lat")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="outlet-lng">Longitude</Label>
          <Input id="outlet-lng" placeholder="112.7521" {...field("lng")} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="outlet-max">Maks. jarak (km)</Label>
          <Input id="outlet-max" placeholder="10" {...field("max_distance_km")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="outlet-perkm">Harga/km</Label>
          <Input id="outlet-perkm" placeholder="2000" {...field("price_per_km")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="outlet-perkg">Harga/kg</Label>
          <Input id="outlet-perkg" placeholder="7000" {...field("price_per_kg")} />
        </div>
      </div>
    </div>
  );
}

export default function SuperOutletsPage() {
  const { data, isLoading } = useOutlets();
  const outlets = data?.data ?? [];

  const create = useCreateOutlet();
  const update = useUpdateOutlet();
  const remove = useDeleteOutlet();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<OutletFormState>(EMPTY);

  const [editing, setEditing] = useState<Outlet | null>(null);
  const [editForm, setEditForm] = useState<OutletFormState>(EMPTY);

  const handleCreate = () => {
    create.mutate(toPayload(createForm), {
      onSuccess: () => {
        setCreateOpen(false);
        setCreateForm(EMPTY);
      },
    });
  };

  const handleUpdate = () => {
    if (!editing) return;
    update.mutate(
      { id: editing.id, ...toPayload(editForm) },
      { onSuccess: () => setEditing(null) },
    );
  };

  return (
    <RequireAuth>
      <SuperShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">Outlet</h1>
              <p className="text-sm text-muted-foreground">
                Kelola outlet I-Wash Noda.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setCreateForm(EMPTY);
                setCreateOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Tambah outlet
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : outlets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <Store className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Belum ada outlet</p>
              <p className="text-sm text-muted-foreground">
                Tambahkan outlet pertama Anda.
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="divide-y">
                {outlets.map((outlet) => (
                  <div
                    key={outlet.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-semibold">{outlet.name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {outlet.address}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="secondary">Rp {outlet.price_per_kg}/kg</Badge>
                        <Badge variant="secondary">Rp {outlet.price_per_km}/km</Badge>
                        <Badge variant="secondary">Maks {outlet.max_distance_km} km</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditing(outlet);
                          setEditForm(toForm(outlet));
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            disabled={remove.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus outlet ini?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {outlet.name} akan dihapus dan tidak bisa digunakan lagi.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove.mutate(outlet.id)}>
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah outlet</DialogTitle>
            </DialogHeader>
            <OutletFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={create.isPending || !createForm.name.trim()}
                onClick={handleCreate}
              >
                {create.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit outlet</DialogTitle>
            </DialogHeader>
            <OutletFields form={editForm} setForm={setEditForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button
                disabled={update.isPending || !editForm.name.trim()}
                onClick={handleUpdate}
              >
                {update.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SuperShell>
    </RequireAuth>
  );
}
