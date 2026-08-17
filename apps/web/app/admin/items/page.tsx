"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Search, Shirt, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useCreateItem,
  useDeleteItem,
  useItems,
  useUpdateItem,
  useWorkerItemSearch,
} from "@/lib/api/queries";
import { useSession } from "@/lib/auth/session-store";
import { useDebounce } from "@/hooks/use-debounce";

export default function AdminItemsPage() {
  const { user } = useSession();
  const isSuperAdmin = user?.role === "super_admin";

  const [keyword, setKeyword] = useState("");
  const debounced = useDebounce(keyword.trim(), 350);
  const searching = debounced.length > 0;

  const { data: allData, isLoading: allLoading } = useItems();
  const search = useWorkerItemSearch(searching ? debounced : "");
  const items = searching ? (search.data?.data ?? []) : (allData?.data ?? []);

  const create = useCreateItem();
  const update = useUpdateItem();
  const remove = useDeleteItem();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const loading = searching ? search.isFetching : allLoading;

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = (id: string) => {
    update.mutate(
      { id, name: editName.trim() },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">Daftar Item</h1>
              <p className="text-sm text-muted-foreground">
                {isSuperAdmin
                  ? "Kelola katalog item laundry."
                  : "Item laundry untuk outlet ini (hanya super admin yang bisa mengubah)."}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Cari item…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          {isSuperAdmin ? (
            <div className="flex gap-2">
              <Input
                placeholder="Nama item baru…"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    create.mutate(newName.trim());
                    setNewName("");
                  }
                }}
              />
              <Button
                variant="default"
                disabled={create.isPending || !newName.trim()}
                onClick={() => {
                  create.mutate(newName.trim());
                  setNewName("");
                }}
              >
                {create.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                Tambah
              </Button>
            </div>
          ) : null}

          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <Shirt className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Item tidak ditemukan</p>
              <p className="text-sm text-muted-foreground">
                {isSuperAdmin
                  ? "Tambahkan item laundry pertama Anda."
                  : "Coba kata kunci lain."}
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 py-3"
                  >
                    {editingId === item.id && isSuperAdmin ? (
                      <>
                        <Input
                          className="flex-1"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <Button
                          size="icon"
                          variant="default"
                          className="h-8 w-8"
                          disabled={update.isPending || !editName.trim()}
                          onClick={() => saveEdit(item.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{item.name}</p>
                        {isSuperAdmin ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => startEdit(item.id, item.name)}
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
                                  <X className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus item ini?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {item.name} akan dihapus dari katalog.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => remove.mutate(item.id)}
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
