"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Package, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminShell } from "@/components/admin/admin-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { useScheduleSummary } from "@/lib/api/queries";
import { DAY_LABEL } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data, isLoading } = useScheduleSummary();
  const summary = data?.data;

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard Outlet</h1>
            <p className="text-sm text-muted-foreground">
              Ringkasan staf, jadwal, dan pesanan hari ini.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {isLoading || !summary ? (
              <>
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="space-y-1 p-4">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Total Pekerja
                    </p>
                    <p className="text-3xl font-bold">{summary.totalWorker}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-1 p-4">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Total Driver
                    </p>
                    <p className="text-3xl font-bold">{summary.totalDriver}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-1 p-4">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      On Duty Hari Ini
                    </p>
                    <p className="text-3xl font-bold">{summary.totalOnDuty}</p>
                    <p className="text-xs text-muted-foreground">
                      {DAY_LABEL[summary.today]}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <Package className="h-4 w-4 text-primary" />
                  Pesanan
                </p>
                <p className="text-sm text-muted-foreground">
                  Periksa dan perbarui item pesanan yang baru tiba di outlet.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/orders">
                    Buka pesanan
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Jadwal Shift
                </p>
                <p className="text-sm text-muted-foreground">
                  Atur jadwal shift pekerja dan driver untuk minggu ini.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/schedule">
                    Kelola jadwal
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
