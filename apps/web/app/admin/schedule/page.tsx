"use client";

import { useState } from "react";
import { CalendarPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  useCreateSchedule,
  useSchedule,
  useScheduleSummary,
  useUnassignedWorkers,
} from "@/lib/api/queries";
import { useDebounce } from "@/hooks/use-debounce";
import { DAY_LABEL, STATION_LABEL } from "@/lib/utils";
import type { WorkerShiftDay, UnScheduledWorker } from "@/lib/api/types";

const DAYS: WorkerShiftDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

interface ShiftRow {
  day: WorkerShiftDay;
  start: string;
  end: string;
}

export default function AdminSchedulePage() {
  const { data: summaryData, isLoading: summaryLoading } = useScheduleSummary();
  const { data: scheduleData, isLoading: scheduleLoading } = useSchedule();
  const create = useCreateSchedule();

  const [role, setRole] = useState<"driver" | "worker">("worker");
  const [keyword, setKeyword] = useState("");
  const debounced = useDebounce(keyword.trim(), 350);
  const { data: unassignedData, isFetching: unassignedLoading } =
    useUnassignedWorkers(debounced, role);

  const [selectedWorker, setSelectedWorker] = useState<UnScheduledWorker | null>(null);
  const [shifts, setShifts] = useState<ShiftRow[]>([]);

  const summary = summaryData?.data;
  const scheduleRows = scheduleData?.data ?? [];
  const unassigned = unassignedData?.data ?? [];

  const grouped = new Map<string, typeof scheduleRows>();
  for (const row of scheduleRows) {
    const list = grouped.get(row.name) ?? [];
    list.push(row);
    grouped.set(row.name, list);
  }

  const pickWorker = (worker: UnScheduledWorker) => {
    setSelectedWorker(worker);
    setShifts([{ day: "mon", start: "08:00", end: "16:00" }]);
  };

  const updateShift = (index: number, patch: Partial<ShiftRow>) => {
    setShifts((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addShift = () => {
    setShifts((prev) => [...prev, { day: "mon", start: "08:00", end: "16:00" }]);
  };

  const handleSave = () => {
    if (!selectedWorker || shifts.length === 0) return;
    create.mutate(
      { workerId: selectedWorker.id, schedules: shifts },
      {
        onSuccess: () => {
          setSelectedWorker(null);
          setShifts([]);
          setKeyword("");
        },
      },
    );
  };

  return (
    <RequireAuth>
      <AdminShell>
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Jadwal Shift</h1>
            <p className="text-sm text-muted-foreground">
              Atur jadwal shift pekerja dan driver.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {summaryLoading || !summary ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Pekerja</p>
                    <p className="text-2xl font-bold">{summary.totalWorker}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Driver</p>
                    <p className="text-2xl font-bold">{summary.totalDriver}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">On duty hari ini</p>
                    <p className="text-2xl font-bold">{summary.totalOnDuty}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Hari</p>
                    <p className="text-xl font-bold">{DAY_LABEL[summary.today]}</p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={role === "worker" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRole("worker")}
                  >
                    Pekerja
                  </Button>
                  <Button
                    type="button"
                    variant={role === "driver" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRole("driver")}
                  >
                    Driver
                  </Button>
                </div>
                <Input
                  className="max-w-52"
                  placeholder="Cari nama…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              {unassignedLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : selectedWorker ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <div>
                      <p className="font-semibold">{selectedWorker.name ?? "Tanpa nama"}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedWorker.role}
                        {selectedWorker.worker_station
                          ? ` • ${STATION_LABEL[selectedWorker.worker_station]}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedWorker(null);
                        setShifts([]);
                      }}
                    >
                      Batal
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {shifts.map((shift, index) => (
                      <div
                        key={index}
                        className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
                      >
                        <div className="space-y-1.5">
                          <Label className="text-xs">Hari</Label>
                          <Select
                            value={shift.day}
                            onValueChange={(value) =>
                              updateShift(index, { day: value as WorkerShiftDay })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map((day) => (
                                <SelectItem key={day} value={day}>
                                  {DAY_LABEL[day]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Mulai</Label>
                          <Input
                            type="time"
                            className="w-32"
                            value={shift.start}
                            onChange={(e) => updateShift(index, { start: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Selesai</Label>
                          <Input
                            type="time"
                            className="w-32"
                            value={shift.end}
                            onChange={(e) => updateShift(index, { end: e.target.value })}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={shifts.length === 1}
                          onClick={() =>
                            setShifts((prev) => prev.filter((_, i) => i !== index))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addShift}>
                      <Plus className="mr-1 h-4 w-4" />
                      Tambah hari
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      disabled={create.isPending || shifts.length === 0}
                      onClick={handleSave}
                    >
                      {create.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Simpan jadwal
                    </Button>
                  </div>
                </div>
              ) : unassigned.length > 0 ? (
                <div className="max-h-64 space-y-1.5 overflow-y-auto">
                  {unassigned.map((worker) => (
                    <button
                      key={worker.id}
                      type="button"
                      onClick={() => pickWorker(worker)}
                      className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    >
                      <span className="font-medium">{worker.name ?? "Tanpa nama"}</span>
                      <span className="text-xs text-muted-foreground">
                        {worker.role}
                        {worker.worker_station
                          ? ` • ${STATION_LABEL[worker.worker_station]}`
                          : ""}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-lg border p-8 text-center">
                  <CalendarPlus className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Pilih pekerja/driver untuk diberi jadwal</p>
                  <p className="text-sm text-muted-foreground">
                    Cari nama di atas. Karyawan yang belum punya jadwal akan muncul.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="mb-3 font-semibold">Daftar jadwal</p>
              {scheduleLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : scheduleRows.length === 0 ? (
                <p className="rounded-lg bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  Belum ada jadwal shift.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        {DAYS.map((day) => (
                          <TableHead key={day} className="text-center">
                            {DAY_LABEL[day]}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...grouped.entries()].map(([name, rows]) => (
                        <TableRow key={name}>
                          <TableCell className="font-medium">{name}</TableCell>
                          {DAYS.map((day) => {
                            const dayRows = rows.filter((r) => r.day_of_week === day);
                            return (
                              <TableCell key={day} className="text-center">
                                {dayRows.length > 0 ? (
                                  <div className="flex flex-col gap-1">
                                    {dayRows.map((row) => (
                                      <Badge key={row.id} variant="secondary">
                                        {row.start_time}–{row.end_time}
                                        {row.station ? ` • ${STATION_LABEL[row.station]}` : ""}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">–</span>
                                )}
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
