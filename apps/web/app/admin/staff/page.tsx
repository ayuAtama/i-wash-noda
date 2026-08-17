"use client";

import { useState } from "react";
import { Loader2, UserPlus, Users } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import {
  useAdminUsers,
  useChangeUserRole,
  useOutlets,
  useRegisterInternalUser,
  useRemoveUser,
} from "@/lib/api/queries";
import { ROLE_LABEL, STATION_LABEL } from "@/lib/utils";
import type { Role } from "@/lib/api/types";

const INTERNAL_ROLES: Role[] = ["outlet_admin", "driver", "worker", "customer"];

export default function AdminStaffPage() {
  const { data: usersData, isLoading: usersLoading } = useAdminUsers();
  const { data: outletsData } = useOutlets();
  const users = usersData?.data ?? [];
  const outlets = outletsData?.data ?? [];

  const register = useRegisterInternalUser();
  const changeRole = useChangeUserRole();
  const remove = useRemoveUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("worker");
  const [outletId, setOutletId] = useState<string>("");

  const openModal = () => {
    setModalOpen(true);
    setEmail("");
    setRole("worker");
    setOutletId(outlets[0]?.id ?? "");
  };

  const handleRegister = () => {
    register.mutate(
      { email: email.trim(), role, outlet_id: outletId || undefined },
      {
        onSuccess: () => {
          setModalOpen(false);
          setEmail("");
        },
      },
    );
  };

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold">Manajemen Staf</h1>
              <p className="text-sm text-muted-foreground">
                Kelola akun pekerja, driver, dan admin outlet.
              </p>
            </div>
            <Button size="sm" onClick={openModal}>
              <UserPlus className="mr-1 h-4 w-4" />
              Tambah staf
            </Button>
          </div>

          {usersLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Belum ada staf</p>
              <p className="text-sm text-muted-foreground">
                Tambahkan staf baru untuk mulai mengelola tim Anda.
              </p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name ?? "Tanpa nama"}
                          {user.worker_station ? (
                            <span className="ml-1 text-xs text-muted-foreground">
                              • {STATION_LABEL[user.worker_station]}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {ROLE_LABEL[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                changeRole.mutate({
                                  userId: user.id,
                                  role: value as Role,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {INTERNAL_ROLES.map((r) => (
                                  <SelectItem key={r} value={r}>
                                    {ROLE_LABEL[r]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8"
                                  disabled={remove.isPending}
                                >
                                  Hapus
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus staf ini?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {user.email} akan dihapus dan tidak bisa masuk lagi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => remove.mutate(user.id)}
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah staf</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="staff@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Peran</Label>
                <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERNAL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Outlet</Label>
                <Select
                  value={outletId}
                  onValueChange={setOutletId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((outlet) => (
                      <SelectItem key={outlet.id} value={outlet.id}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={register.isPending || !email.trim() || !outletId}
                onClick={handleRegister}
              >
                {register.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Kirim undangan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminShell>
    </RequireAuth>
  );
}
