"use client";

import { CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { useSchedule } from "@/lib/api/queries";
import { DAY_LABEL, STATION_LABEL } from "@/lib/utils";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const GROUPS: { key: string; label: string }[] = [
  { key: "washing", label: STATION_LABEL["washing"] ?? "Cuci" },
  { key: "ironing", label: STATION_LABEL["ironing"] ?? "Setrika" },
  { key: "packing", label: STATION_LABEL["packing"] ?? "Packing" },
  { key: "driver", label: "Driver" },
];

export default function ScheduleSummaryPage() {
  const { data, isLoading } = useSchedule();
  const rows = data?.data ?? [];

  const count = (groupKey: string, day: string) => {
    const matches = rows.filter((row) => {
      const key =
        row.station === null ? "driver" : (row.station ?? "driver");
      return key === groupKey && row.day_of_week === day;
    });
    return new Set(matches.map((row) => row.worker_id)).size;
  };

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-4xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Rangkuman Cakupan</h1>
            <p className="text-sm text-muted-foreground">
              Jumlah staf yang terjadwal per stasiun dan hari.
            </p>
          </div>

          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-10 text-center">
                  <CalendarRange className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">Belum ada jadwal</p>
                  <p className="text-sm text-muted-foreground">
                    Tetapkan jadwal shift dulu di halaman jadwal.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stasiun</TableHead>
                        {DAYS.map((day) => (
                          <TableHead key={day} className="text-center">
                            {DAY_LABEL[day]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {GROUPS.map((group) => (
                        <TableRow key={group.key}>
                          <TableCell className="font-medium">{group.label}</TableCell>
                          {DAYS.map((day) => {
                            const value = count(group.key, day);
                            return (
                              <TableCell key={day} className="text-center">
                                <Badge
                                  variant={value > 0 ? "default" : "secondary"}
                                >
                                  {value}
                                </Badge>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </RequireAuth>
  );
}
