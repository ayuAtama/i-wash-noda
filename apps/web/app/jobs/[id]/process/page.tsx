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
import { Skeleton } from "@/components/ui/skeleton";
import { WorkerShell } from "@/components/worker/worker-shell";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useAcceptWorkerJob,
  useReinputItems,
  useWorkerActive,
  useWorkerAvailable,
  useWorkerItemSearch,
} from "@/lib/api/queries";
import type { ReInputResponse } from "@/lib/api/types";

interface PickedItem {
  itemId: string;
  name: string;
  quantity: number;
}

type ResultPayload = ReInputResponse["data"];

export default function ProcessJobPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params.id;

  const [keyword, setKeyword] = useState("");
  const [picked, setPicked] = useState<PickedItem[]>([]);
  const [result, setResult] = useState<ResultPayload | null>(null);

  const { data: availableData } = useWorkerAvailable();
  const { data: activeData } = useWorkerActive();

  const job =
    (availableData?.data ?? []).find((job) => job.id === jobId) ??
    (activeData?.data ?? []).find((job) => job.id === jobId) ??
    null;
  const isAssigned = Boolean((activeData?.data ?? []).some((job) => job.id === jobId));

  const search = useWorkerItemSearch(keyword);
  const searchResults = search.data?.data ?? [];

  const accept = useAcceptWorkerJob();
  const reinput = useReinputItems();

  const busy = accept.isPending || reinput.isPending;
  const totalItems = picked.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = (item: { id: string; name: string }) => {
    setResult(null);
    setPicked((prev) => {
      const existing = prev.find((p) => p.itemId === item.id);
      if (existing) {
        return prev.map((p) =>
          p.itemId === item.id
            ? { ...p, quantity: Math.min(100, p.quantity + 1) }
            : p,
        );
      }
      return [...prev, { itemId: item.id, name: item.name, quantity: 1 }];
    });
  };

  const changeQuantity = (itemId: string, delta: number) => {
    setPicked((prev) =>
      prev.map((p) => {
        if (p.itemId !== itemId) return p;
        const quantity = Math.max(1, Math.min(100, p.quantity + delta));
        return { ...p, quantity };
      }),
    );
  };

  const removeItem = (itemId: string) => {
    setPicked((prev) => prev.filter((p) => p.itemId !== itemId));
  };

  const handleSubmit = async () => {
    if (picked.length === 0) return;
    setResult(null);
    try {
      if (!isAssigned) {
        await accept.mutateAsync(jobId);
      }
      const res = await reinput.mutateAsync({
        orderId: jobId,
        items: picked.map((p) => ({ itemId: p.itemId, itemQuantity: p.quantity })),
      });
      setResult(res.data);
      if (res.success) {
        setPicked([]);
        setKeyword("");
      }
    } catch {
      // toasts handled inside the mutations
    }
  };

  const hasMismatch =
    result !== null && "mismatch" in result;

  return (
    <RequireAuth>
      <WorkerShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/jobs/available">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali
              </Link>
            </Button>
            {job ? (
              <Badge variant="secondary">
                {job.customer_name}
              </Badge>
            ) : null}
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <h1 className="text-lg font-bold">Proses Pekerjaan</h1>
                <p className="text-sm text-muted-foreground">
                  Cari item, atur jumlah, lalu kirim.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari item… (contoh: Baju Pramuka)"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                    setResult(null);
                  }}
                />
              </div>

              {search.isFetching ? (
                <Skeleton className="h-16 w-full" />
              ) : keyword.trim().length > 0 ? (
                searchResults.length > 0 ? (
                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => addItem(item)}
                        className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">+ Tambah</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Item tidak ditemukan.
                  </p>
                )
              ) : null}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Item diinput</p>
                  <p className="text-sm text-muted-foreground">
                    Total: {totalItems} item
                  </p>
                </div>

                {picked.length === 0 ? (
                  <p className="rounded-lg bg-muted/40 p-4 text-center text-sm text-muted-foreground">
                    Belum ada item. Gunakan pencarian di atas untuk menambahkan item.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {picked.map((item) => (
                      <div
                        key={item.itemId}
                        className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                      >
                        <p className="min-w-0 truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={busy}
                            onClick={() => changeQuantity(item.itemId, -1)}
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
                            disabled={busy}
                            onClick={() => changeQuantity(item.itemId, 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            disabled={busy}
                            onClick={() => removeItem(item.itemId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {result ? (
                hasMismatch ? (
                  <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-semibold">
                      Mismatch terdeteksi — menunggu persetujuan admin
                    </p>
                    <ul className="list-inside list-disc space-y-0.5">
                      <li>Cocok: {result.match.length}</li>
                      <li>Jumlah berbeda: {result.mismatch.length}</li>
                      <li>Item baru: {result.new.length}</li>
                      <li>Item tidak diinput: {result.lost.length}</li>
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <p className="font-semibold">Item cocok — disetujui otomatis</p>
                    <p className="mt-0.5">
                      Semua {result.match.length} item cocok dengan jumlah awal.
                    </p>
                  </div>
                )
              ) : null}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={() => router.push("/jobs/active")}
                >
                  Lihat aktif
                </Button>
                <Button
                  className="flex-1"
                  disabled={busy || picked.length === 0}
                  onClick={handleSubmit}
                >
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {isAssigned ? "Kirim re-input" : "Terima & kirim"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </WorkerShell>
    </RequireAuth>
  );
}
