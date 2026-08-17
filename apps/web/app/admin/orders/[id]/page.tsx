"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useAdminOrders, useUpdateOrderItem, useWorkerItemSearch } from "@/lib/api/queries";

interface EditItem {
  id?: string;
  name: string;
  quantity: number;
}

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params.id;

  const { data, isLoading } = useAdminOrders();
  const updateOrder = useUpdateOrderItem();

  const [keyword, setKeyword] = useState("");
  const [newName, setNewName] = useState("");
  const [totalKg, setTotalKg] = useState<number | null>(null);
  const [items, setItems] = useState<EditItem[]>([]);

  const order = (data?.data ?? []).find((o) => o.id === orderId) ?? null;

  const search = useWorkerItemSearch(keyword);
  const searchResults = search.data?.data ?? [];

  const effectiveKg = totalKg ?? order?.total_kilo ?? 0;

  const addById = (item: { id: string; name: string }) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, { id: item.id, name: item.name, quantity: 1 }];
    });
    setKeyword("");
  };

  const addByName = () => {
    const name = newName.trim();
    if (!name) return;
    setItems((prev) => {
      if (prev.some((i) => !i.id && i.name.toLowerCase() === name.toLowerCase())) {
        return prev.map((i) =>
          !i.id && i.name.toLowerCase() === name.toLowerCase()
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { name, quantity: 1 }];
    });
    setNewName("");
  };

  const changeQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, quantity: Math.max(1, Math.min(100, item.quantity + delta)) }
          : item,
      ),
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!order || items.length === 0) return;
    updateOrder.mutate(
      {
        orderId,
        body: {
          totalWeights: effectiveKg,
          items: items.map((item) =>
            item.id ? { id: item.id, quantity: item.quantity } : { name: item.name, quantity: item.quantity },
          ),
        },
      },
      {
        onSuccess: () => {
          router.push("/admin/orders");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <RequireAuth>
        <AdminShell>
          <div className="mx-auto max-w-3xl">
            <Skeleton className="h-72 w-full" />
          </div>
        </AdminShell>
      </RequireAuth>
    );
  }

  if (!order) {
    return (
      <RequireAuth>
        <AdminShell>
          <div className="mx-auto max-w-3xl space-y-3 py-10 text-center">
            <p className="font-medium">Pesanan tidak ditemukan atau sudah diproses</p>
            <p className="text-sm text-muted-foreground">
              Pesanan hanya bisa diedit saat statusnya &quot;tiba di outlet&quot;.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orders">Kembali ke pesanan</Link>
            </Button>
          </div>
        </AdminShell>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/admin/orders">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali
              </Link>
            </Button>
            <Badge variant={order.paid ? "default" : "secondary"}>
              {order.paid ? "Lunas" : "Belum bayar"}
            </Badge>
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <h1 className="text-lg font-bold">{order.customer_name ?? "Pelanggan"}</h1>
                <p className="text-sm text-muted-foreground">
                  {order.pickupAddress?.address ?? "-"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Total kg</p>
                  <p className="font-semibold">{order.total_kilo}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cuci</p>
                  <p className="font-semibold">Rp {order.laundry_price.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jemput</p>
                  <p className="font-semibold">Rp {order.pickup_fee.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Antar</p>
                  <p className="font-semibold">Rp {order.delivery_fee.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="total-kg">Total berat (kg)</Label>
                  <Input
                    id="total-kg"
                    type="number"
                    min={1}
                    step={0.1}
                    value={effectiveKg}
                    onChange={(e) =>
                      setTotalKg(e.target.value === "" ? null : Number(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Perkiraan total</Label>
                  <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                    Harga cuci + jemput + antar dihitung server.
                    <span className="mt-0.5 block font-semibold text-foreground">
                      Total saat ini: Rp {order.total_amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="font-semibold">Item pesanan</p>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Cari item…"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                {search.isFetching ? (
                  <Skeleton className="h-10 w-full" />
                ) : keyword.trim().length > 0 ? (
                  searchResults.length > 0 ? (
                    <div className="max-h-44 space-y-1.5 overflow-y-auto">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addById(item)}
                          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        >
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">+ Tambah</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Item tidak ditemukan.</p>
                  )
                ) : null}

                <div className="flex gap-2">
                  <Input
                    placeholder="Atau ketik nama item baru…"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addByName();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addByName}>
                    Tambah
                  </Button>
                </div>

                {items.length === 0 ? (
                  <p className="rounded-lg bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                    Belum ada item ditambahkan untuk edit ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                      >
                        <p className="min-w-0 truncate text-sm font-medium">{item.name}</p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => changeQuantity(index, -1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => changeQuantity(index, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                disabled={updateOrder.isPending || items.length === 0 || effectiveKg < 1}
                onClick={handleSave}
              >
                {updateOrder.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Simpan & kirim ke pencucian
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
