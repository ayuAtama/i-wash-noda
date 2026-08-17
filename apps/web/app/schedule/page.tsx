"use client";

import { CalendarX2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DriverShell } from "@/components/driver/driver-shell";
import { RequireAuth } from "@/lib/auth/guards";
import { DAY_LABEL } from "@/lib/utils";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export default function DriverSchedulePage() {
  return (
    <RequireAuth>
      <DriverShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-xl font-bold">Jadwal Shift</h1>

          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <CalendarX2 className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Belum ada jadwal shift</p>
                <p className="text-sm text-muted-foreground">
                  Admin outlet belum memberikan jadwal shift untuk Anda. Silakan
                  hubungi admin outlet Anda.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="mb-3 font-semibold">Tampilan mingguan</p>
              <div className="space-y-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{DAY_LABEL[day]}</span>
                    <span className="text-muted-foreground">Tidak ada shift</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DriverShell>
    </RequireAuth>
  );
}
