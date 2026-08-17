"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useCreateWalkInOrder, useWorkerItemSearch } from "@/lib/api/queries";

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
}

function ManualOrderContent() {
  const params = useParams<{ walkinId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const customerName = searchParams.get("name") ?? "Pelanggan walk-in";

  const createOrder = useCreateWalkInOrder();

  const [keyword, setKeyword] = useState("");
  const [newName, setNewName] = useState("");
  const [totalKilo, setTotalKilo] = useState<number | null>(null);
  const [paid, setPaid] = useState(false);
  const [items, setItems] = useState<OrderItem[]>([]);

  const search = useWorkerItemSearch(keyword);
  const searchResults = search.data?.data ?? [];

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

  const handleSubmit = () => {
    if (items.length === 0 || !totalKilo || totalKilo < 1) return;
    createOrder.mutate(
      {
        id: params.walkinId,
        body: {
          total_kilo: totalKilo,
          paid,
          items: items.map((item) =>
            item.id
              ? { id: item.id, quantity: item.quantity }
              : { name: item.name, quantity: item.quantity },
          ),
          pickup_fee: 0,
          delivery_fee: 0,
          laundry_price: 0,
          total_amount: 0,
          status: "arrived_at_outlet",
          source: "walk_in",
        },
      },
      { onSuccess: () => router.push("/admin/orders") },
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/walk-in">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Kembali
        </Link>
      </Button>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div>
            <h1 className="text-lg font-bold">Pesanan Manual</h1>
            <p className="text-sm text-muted-foreground">
              Buat pesanan walk-in untuk {customerName}.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="total-kilo">Total berat (kg)</Label>
              <Input
                id="total-kilo"
                type="number"
                min={1}
                step={0.1}
                placeholder="cth: 5"
                value={totalKilo ?? ""}
                onChange={(e) =>
                  setTotalKilo(e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
            <div className="flex items-end justify-between gap-2 pb-1">
              <div>
                <p className="text-sm text-muted-foreground">Sudah dibayar?</p>
                <p className="text-xs text-muted-foreground">
                  Fee & status dihitung server.
                </p>
              </div>
              <Switch checked={paid} onCheckedChange={setPaid} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-semibold">Item</p>

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
                Belum ada item.
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
            disabled={
              createOrder.isPending || items.length === 0 || !totalKilo || totalKilo < 1
            }
            onClick={handleSubmit}
          >
            {createOrder.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Buat pesanan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ManualOrderPage() {
  return (
    <RequireAuth>
      <AdminShell>
        <Suspense fallback={<Skeleton className="mx-auto h-72 max-w-3xl" />}>
          <ManualOrderContent />
        </Suspense>
      </AdminShell>
    </RequireAuth>
  );
}
